import { eq, and, desc, gt, or } from 'drizzle-orm';
import { db } from '../index';
import { storiesTable, type Story, type StoryAudience, type StorySticker, type StoryPoll } from '../schema';

/**
 * Domain types for story repository
 * These hide the underlying Drizzle table structure from callers
 */

export interface StoryCreateInput {
  authorId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  stickers?: StorySticker[];
  poll?: StoryPoll;
  audience: StoryAudience;
  audienceListId?: string;
  expiresAt: Date;
}

export interface StoryWithAuthor {
  id: string;
  authorId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  stickers: StorySticker[];
  poll: StoryPoll | null;
  audience: StoryAudience;
  audienceListId: string | null;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * StoryRepository encapsulates all story data access logic.
 *
 * Deep module: Hides Drizzle internals, JSONB parsing, and expiration filtering
 * behind a simple interface of domain operations.
 */
export class StoryRepository {
  /**
   * Create a new story
   * @param input - Story creation data
   * @returns The created story
   */
  async create(input: StoryCreateInput): Promise<StoryWithAuthor> {
    const result = await db
      .insert(storiesTable)
      .values({
        authorId: input.authorId,
        mediaUrl: input.mediaUrl,
        mediaType: input.mediaType,
        stickers: input.stickers || [],
        poll: input.poll,
        audience: input.audience,
        audienceListId: input.audienceListId,
        expiresAt: input.expiresAt,
      })
      .returning();

    return this.toStoryWithAuthor(result[0]);
  }

  /**
   * Get a story by ID
   * @param storyId - The story's UUID
   * @returns The story or null if not found
   */
  async getById(storyId: string): Promise<StoryWithAuthor | null> {
    const result = await db.select().from(storiesTable).where(eq(storiesTable.id, storyId)).limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toStoryWithAuthor(result[0]);
  }

  /**
   * List stories by author ID, ordered by creation date (newest first)
   * Only returns non-expired stories
   * @param authorId - The author's UUID
   * @returns Array of non-expired stories
   */
  async listByAuthor(authorId: string): Promise<StoryWithAuthor[]> {
    const now = new Date();
    const results = await db
      .select()
      .from(storiesTable)
      .where(
        and(
          eq(storiesTable.authorId, authorId),
          gt(storiesTable.expiresAt, now)
        )
      )
      .orderBy(desc(storiesTable.createdAt));

    return results.map((story) => this.toStoryWithAuthor(story));
  }

  /**
   * List stories for multiple authors, ordered by creation date (newest first)
   * Only returns non-expired stories
   * @param authorIds - Array of author UUIDs
   * @returns Array of non-expired stories
   */
  async listByAuthors(authorIds: string[]): Promise<StoryWithAuthor[]> {
    if (authorIds.length === 0) {
      return [];
    }

    const now = new Date();
    const results = await db
      .select()
      .from(storiesTable)
      .where(
        and(
          // Use OR to match any of the author IDs
          or(...authorIds.map((id) => eq(storiesTable.authorId, id))),
          gt(storiesTable.expiresAt, now)
        )
      )
      .orderBy(desc(storiesTable.createdAt));

    return results.map((story) => this.toStoryWithAuthor(story));
  }

  /**
   * Delete a story
   * @param storyId - The story's UUID
   * @returns The deleted story or null if not found
   */
  async delete(storyId: string): Promise<StoryWithAuthor | null> {
    const result = await db.delete(storiesTable).where(eq(storiesTable.id, storyId)).returning();

    if (result.length === 0) {
      return null;
    }

    return this.toStoryWithAuthor(result[0]);
  }

  /**
   * Delete expired stories
   * @returns Number of deleted stories
   */
  async deleteExpired(): Promise<number> {
    const now = new Date();
    const result = await db
      .delete(storiesTable)
      .where(gt(storiesTable.expiresAt, now))
      .returning();

    return result.length;
  }

  /**
   * Convert a Drizzle story row to a domain StoryWithAuthor
   * This encapsulates the mapping logic
   */
  private toStoryWithAuthor(story: Story): StoryWithAuthor {
    return {
      id: story.id,
      authorId: story.authorId,
      mediaUrl: story.mediaUrl,
      mediaType: story.mediaType,
      stickers: story.stickers || [],
      poll: story.poll,
      audience: story.audience,
      audienceListId: story.audienceListId,
      expiresAt: story.expiresAt,
      createdAt: story.createdAt,
    };
  }
}

// Export a singleton instance for convenience
export const storyRepository = new StoryRepository();
