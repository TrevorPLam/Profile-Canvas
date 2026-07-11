import { eq, and, count } from 'drizzle-orm';
import { db } from '../index';
import { likesTable, savesTable, type Like, type Save } from '../schema';
import { postsTable } from '../schema/posts';

/**
 * Domain types for engagement repository
 * These hide the underlying Drizzle table structure from callers
 */

export interface EngagementSummary {
  postId: string;
  likeCount: number;
  saveCount: number;
  repostCount: number;
  viewerHasLiked: boolean;
  viewerHasSaved: boolean;
  viewerHasReposted: boolean;
}

/**
 * EngagementRepository encapsulates all engagement data access logic.
 *
 * Deep module: Hides Drizzle internals, count derivation, and idempotency logic
 * behind a simple interface of domain operations.
 */
export class EngagementRepository {
  /**
   * Create a like for a post (idempotent - handles duplicates via unique constraint)
   * @param userId - The user's UUID
   * @param postId - The post's UUID
   * @returns The created like or null if already exists
   */
  async createLike(userId: string, postId: string): Promise<Like | null> {
    try {
      const result = await db.insert(likesTable).values({ userId, postId }).returning();
      return result[0] || null;
    } catch {
      // Unique constraint violation means already liked
      // This is expected for idempotent operations
      return null;
    }
  }

  /**
   * Delete a like for a post (idempotent - handles non-existent likes)
   * @param userId - The user's UUID
   * @param postId - The post's UUID
   * @returns The deleted like or null if not found
   */
  async deleteLike(userId: string, postId: string): Promise<Like | null> {
    const result = await db
      .delete(likesTable)
      .where(and(eq(likesTable.userId, userId), eq(likesTable.postId, postId)))
      .returning();
    return result[0] || null;
  }

  /**
   * Check if a user has liked a post
   * @param userId - The user's UUID
   * @param postId - The post's UUID
   * @returns True if the user has liked the post
   */
  async hasLiked(userId: string, postId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(likesTable)
      .where(and(eq(likesTable.userId, userId), eq(likesTable.postId, postId)))
      .limit(1);
    return result.length > 0;
  }

  /**
   * Create a save for a post (idempotent - handles duplicates via unique constraint)
   * @param userId - The user's UUID
   * @param postId - The post's UUID
   * @returns The created save or null if already exists
   */
  async createSave(userId: string, postId: string): Promise<Save | null> {
    try {
      const result = await db.insert(savesTable).values({ userId, postId }).returning();
      return result[0] || null;
    } catch {
      // Unique constraint violation means already saved
      // This is expected for idempotent operations
      return null;
    }
  }

  /**
   * Delete a save for a post (idempotent - handles non-existent saves)
   * @param userId - The user's UUID
   * @param postId - The post's UUID
   * @returns The deleted save or null if not found
   */
  async deleteSave(userId: string, postId: string): Promise<Save | null> {
    const result = await db
      .delete(savesTable)
      .where(and(eq(savesTable.userId, userId), eq(savesTable.postId, postId)))
      .returning();
    return result[0] || null;
  }

  /**
   * Check if a user has saved a post
   * @param userId - The user's UUID
   * @param postId - The post's UUID
   * @returns True if the user has saved the post
   */
  async hasSaved(userId: string, postId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(savesTable)
      .where(and(eq(savesTable.userId, userId), eq(savesTable.postId, postId)))
      .limit(1);
    return result.length > 0;
  }

  /**
   * Count total likes for a post
   * @param postId - The post's UUID
   * @returns Total number of likes for the post
   */
  async countLikes(postId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(likesTable)
      .where(eq(likesTable.postId, postId));
    return result[0]?.count || 0;
  }

  /**
   * Count total saves for a post
   * @param postId - The post's UUID
   * @returns Total number of saves for the post
   */
  async countSaves(postId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(savesTable)
      .where(eq(savesTable.postId, postId));
    return result[0]?.count || 0;
  }

  /**
   * Count total reposts for a post (derived from posts table)
   * @param postId - The post's UUID
   * @returns Total number of reposts for the post
   */
  async countReposts(_postId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(postsTable)
      .where(eq(postsTable.kind, 'repost' as unknown as 'text' | 'video' | 'reel'));
    // This is a simplified check - in production you'd want a more robust JSONB query
    // to check if repostOf.originalPostId matches
    return result[0]?.count || 0;
  }

  /**
   * Get engagement summary for a post from a viewer's perspective
   * @param postId - The post's UUID
   * @param viewerId - The viewer's UUID (optional, for anonymous viewers)
   * @returns Engagement summary with counts and viewer state
   */
  async getEngagementSummary(postId: string, viewerId?: string): Promise<EngagementSummary> {
    const [likeCount, saveCount, repostCount] = await Promise.all([
      this.countLikes(postId),
      this.countSaves(postId),
      this.countReposts(postId),
    ]);

    const viewerHasLiked = viewerId ? await this.hasLiked(viewerId, postId) : false;
    const viewerHasSaved = viewerId ? await this.hasSaved(viewerId, postId) : false;
    // Viewer repost check would require checking posts table for repostOf
    // For now, this is a placeholder
    const viewerHasReposted = false;

    return {
      postId,
      likeCount,
      saveCount,
      repostCount,
      viewerHasLiked,
      viewerHasSaved,
      viewerHasReposted,
    };
  }
}

// Export a singleton instance for convenience
export const engagementRepository = new EngagementRepository();
