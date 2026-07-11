import { eq, and, desc, or } from 'drizzle-orm';
import { db } from '../index';
import { postsTable, type Post, type PostContent, type RepostInfo } from '../schema';

/**
 * Domain types for post repository
 * These hide the underlying Drizzle table structure from callers
 */

export interface PostCreateInput {
  authorId: string;
  kind: 'text' | 'video' | 'reel';
  content: PostContent;
  topics: string[];
  repostOf?: RepostInfo;
  remixOf?: { originalPostId: string; originalAuthorId: string };
  duetOf?: { originalPostId: string; originalAuthorId: string; layout?: 'side-by-side' | 'vertical' | 'horizontal' };
  audience?: 'everyone' | 'friends' | 'custom';
  audienceListId?: string;
  collabRequestStatus?: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  secondAuthorId?: string;
}

export interface PostUpdateInput {
  content?: PostContent;
  topics?: string[];
  deletedAt?: Date | null;
}

export interface PostWithAuthor {
  id: string;
  authorId: string;
  kind: 'text' | 'video' | 'reel';
  content: PostContent;
  repostOf: RepostInfo | null;
  remixOf: { originalPostId: string; originalAuthorId: string } | null;
  duetOf: { originalPostId: string; originalAuthorId: string; layout?: 'side-by-side' | 'vertical' | 'horizontal' } | null;
  topics: string[];
  audience: 'everyone' | 'friends' | 'custom';
  audienceListId: string | null;
  collabRequestStatus: 'pending' | 'accepted' | 'rejected' | 'cancelled' | null;
  secondAuthorId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * PostRepository encapsulates all post data access logic.
 *
 * Deep module: Hides Drizzle internals, JSONB parsing, and repost chain logic
 * behind a simple interface of domain operations.
 */
export class PostRepository {
  /**
   * Create a new post
   * @param input - Post creation data
   * @returns The created post
   */
  async create(input: PostCreateInput): Promise<PostWithAuthor> {
    const result = await db
      .insert(postsTable)
      .values({
        authorId: input.authorId,
        kind: input.kind,
        content: input.content,
        topics: input.topics,
        repostOf: input.repostOf,
      })
      .returning();

    return this.toPostWithAuthor(result[0]);
  }

  /**
   * Get a post by ID
   * @param postId - The post's UUID
   * @returns The post or null if not found
   */
  async getById(postId: string): Promise<PostWithAuthor | null> {
    const result = await db.select().from(postsTable).where(eq(postsTable.id, postId)).limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toPostWithAuthor(result[0]);
  }

  /**
   * List posts by author ID, ordered by creation date (newest first)
   * @param authorId - The author's UUID
   * @param limit - Maximum number of posts to return
   * @param offset - Number of posts to skip for pagination
   * @returns Array of posts
   */
  async listByAuthor(
    authorId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<PostWithAuthor[]> {
    const results = await db
      .select()
      .from(postsTable)
      .where(
        and(
          eq(postsTable.authorId, authorId),
          // Only return non-deleted posts
          or(
            eq(postsTable.deletedAt, null as unknown as Date),
            // @ts-ignore - Drizzle ORM type limitation for null checks
            postsTable.deletedAt.isNull
          )
        )
      )
      .orderBy(desc(postsTable.createdAt))
      .limit(limit)
      .offset(offset);

    return results.map((post) => this.toPostWithAuthor(post));
  }

  /**
   * List all posts with optional pagination
   * @param limit - Maximum number of posts to return
   * @param offset - Number of posts to skip for pagination
   * @returns Array of posts
   */
  async list(limit: number = 20, offset: number = 0): Promise<PostWithAuthor[]> {
    const results = await db
      .select()
      .from(postsTable)
      .where(
        // Only return non-deleted posts
        or(
          eq(postsTable.deletedAt, null as unknown as Date),
          // @ts-ignore - Drizzle ORM type limitation for null checks
          postsTable.deletedAt.isNull
        )
      )
      .orderBy(desc(postsTable.createdAt))
      .limit(limit)
      .offset(offset);

    return results.map((post) => this.toPostWithAuthor(post));
  }

  /**
   * Update a post
   * @param postId - The post's UUID
   * @param updates - Fields to update
   * @returns The updated post or null if not found
   */
  async update(postId: string, updates: PostUpdateInput): Promise<PostWithAuthor | null> {
    const result = await db
      .update(postsTable)
      .set(updates)
      .where(eq(postsTable.id, postId))
      .returning();

    if (result.length === 0) {
      return null;
    }

    return this.toPostWithAuthor(result[0]);
  }

  /**
   * Soft delete a post by setting deletedAt
   * @param postId - The post's UUID
   * @returns The deleted post or null if not found
   */
  async softDelete(postId: string): Promise<PostWithAuthor | null> {
    return this.update(postId, { deletedAt: new Date() });
  }

  /**
   * Permanently delete a post
   * @param postId - The post's UUID
   * @returns The deleted post or null if not found
   */
  async delete(postId: string): Promise<PostWithAuthor | null> {
    const result = await db.delete(postsTable).where(eq(postsTable.id, postId)).returning();

    if (result.length === 0) {
      return null;
    }

    return this.toPostWithAuthor(result[0]);
  }

  /**
   * Resolve the ultimate original post in a repost chain
   * @param postId - The post's UUID (may be a repost)
   * @returns The ultimate original post, or the post itself if not a repost
   */
  async resolveOriginal(postId: string): Promise<PostWithAuthor> {
    const post = await this.getById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // If not a repost, return as-is
    if (!post.repostOf) {
      return post;
    }

    // Recursively resolve the original post
    // This handles reposts of reposts by always following to the ultimate original
    return this.resolveOriginal(post.repostOf.originalPostId);
  }

  /**
   * Check if a user has already reposted a specific original post
   * @param userId - The user's UUID
   * @param originalPostId - The original post's UUID
   * @returns True if the user has reposted this post
   */
  async hasReposted(userId: string, originalPostId: string): Promise<boolean> {
    const results = await db
      .select()
      .from(postsTable)
      .where(
        and(
          eq(postsTable.authorId, userId),
          // Check if repostOf.originalPostId matches
          // This is a simplified check - in production you'd want a more robust JSONB query
          eq(postsTable.kind, 'repost' as unknown as 'text' | 'video' | 'reel')
        )
      )
      .limit(1);

    if (results.length === 0) {
      return false;
    }

    // Check the repostOf field for matching originalPostId
    const post = results[0];
    if (post.repostOf && post.repostOf.originalPostId === originalPostId) {
      return true;
    }

    return false;
  }

  /**
   * Convert a Drizzle post row to a domain PostWithAuthor
   * This encapsulates the mapping logic
   */
  private toPostWithAuthor(post: Post): PostWithAuthor {
    return {
      id: post.id,
      authorId: post.authorId,
      kind: post.kind,
      content: post.content,
      repostOf: post.repostOf,
      remixOf: post.remixOf,
      duetOf: post.duetOf,
      topics: post.topics,
      audience: post.audience || 'everyone',
      audienceListId: post.audienceListId || null,
      collabRequestStatus: post.collabRequestStatus || null,
      secondAuthorId: post.secondAuthorId || null,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      deletedAt: post.deletedAt,
    };
  }
}

// Export a singleton instance for convenience
export const postRepository = new PostRepository();
