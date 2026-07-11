import { eq, and, desc } from 'drizzle-orm';
import { db } from '../index';
import { commentsTable, type Comment } from '../schema';
import { profilesTable } from '../schema/profiles';

/**
 * Domain types for comment repository
 * These hide the underlying Drizzle table structure from callers
 */

export interface CommentCreateInput {
  postId: string;
  authorId: string;
  text: string;
}

export interface CommentWithAuthor {
  id: string;
  postId: string;
  authorId: string;
  text: string;
  createdAt: Date;
  author: {
    userId: string;
    handle: string;
    name: string;
    avatarUrl: string | null;
  };
}

/**
 * CommentRepository encapsulates all comment data access logic.
 *
 * Deep module: Hides Drizzle internals, author joins, and pagination logic
 * behind a simple interface of domain operations.
 */
export class CommentRepository {
  /**
   * Create a new comment
   * @param input - Comment creation data
   * @returns The created comment with author information
   */
  async create(input: CommentCreateInput): Promise<CommentWithAuthor> {
    const result = await db
      .insert(commentsTable)
      .values({
        postId: input.postId,
        authorId: input.authorId,
        text: input.text,
      })
      .returning();

    const comment = await this.getWithAuthor(result[0].id);

    if (!comment) {
      throw new Error('Failed to retrieve created comment');
    }

    return comment;
  }

  /**
   * Get a comment by ID with author information
   * @param commentId - The comment's UUID
   * @returns The comment with author or null if not found
   */
  async getWithAuthor(commentId: string): Promise<CommentWithAuthor | null> {
    const result = await db
      .select({
        id: commentsTable.id,
        postId: commentsTable.postId,
        authorId: commentsTable.authorId,
        text: commentsTable.text,
        createdAt: commentsTable.createdAt,
        author: {
          userId: profilesTable.userId,
          handle: profilesTable.handle,
          name: profilesTable.name,
          avatarUrl: profilesTable.avatarUrl,
        },
      })
      .from(commentsTable)
      .innerJoin(profilesTable, eq(commentsTable.authorId, profilesTable.userId))
      .where(eq(commentsTable.id, commentId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0] as CommentWithAuthor;
  }

  /**
   * List comments for a post with author information, ordered chronologically
   * @param postId - The post's UUID
   * @param limit - Maximum number of comments to return
   * @param offset - Number of comments to skip for pagination
   * @returns Array of comments with author information
   */
  async listForPost(
    postId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<CommentWithAuthor[]> {
    const results = await db
      .select({
        id: commentsTable.id,
        postId: commentsTable.postId,
        authorId: commentsTable.authorId,
        text: commentsTable.text,
        createdAt: commentsTable.createdAt,
        author: {
          userId: profilesTable.userId,
          handle: profilesTable.handle,
          name: profilesTable.name,
          avatarUrl: profilesTable.avatarUrl,
        },
      })
      .from(commentsTable)
      .innerJoin(profilesTable, eq(commentsTable.authorId, profilesTable.userId))
      .where(eq(commentsTable.postId, postId))
      .orderBy(desc(commentsTable.createdAt))
      .limit(limit)
      .offset(offset);

    return results as CommentWithAuthor[];
  }

  /**
   * Count total comments for a post
   * @param postId - The post's UUID
   * @returns Total number of comments for the post
   */
  async countForPost(postId: string): Promise<number> {
    const result = await db
      .select({ count: commentsTable.id })
      .from(commentsTable)
      .where(eq(commentsTable.postId, postId));

    return result.length;
  }

  /**
   * Delete a comment by ID
   * @param commentId - The comment's UUID
   * @returns The deleted comment or null if not found
   */
  async delete(commentId: string): Promise<CommentWithAuthor | null> {
    const comment = await this.getWithAuthor(commentId);

    if (!comment) {
      return null;
    }

    await db.delete(commentsTable).where(eq(commentsTable.id, commentId));

    return comment;
  }
}

// Export a singleton instance for convenience
export const commentRepository = new CommentRepository();
