import { eq } from 'drizzle-orm';
import { db } from '../index';
import { pollsTable, type Poll, type InsertPoll, type PollVote } from '../schema';

/**
 * Domain types for poll repository
 */

export interface PollWithPost extends Poll {
  // Additional fields can be added here if needed
}

/**
 * PollRepository encapsulates all poll data access logic.
 *
 * Deep module: Hides Drizzle internals, JSONB operations, and vote tracking
 * behind a simple interface of domain operations.
 */
export class PollRepository {
  /**
   * Get a poll by ID
   * @param pollId - The poll's UUID
   * @returns The poll or null if not found
   */
  async getById(pollId: string): Promise<Poll | null> {
    const result = await db
      .select()
      .from(pollsTable)
      .where(eq(pollsTable.id, pollId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0];
  }

  /**
   * Get a poll by post ID
   * @param postId - The post's UUID
   * @returns The poll or null if not found
   */
  async getByPostId(postId: string): Promise<Poll | null> {
    const result = await db
      .select()
      .from(pollsTable)
      .where(eq(pollsTable.postId, postId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0];
  }

  /**
   * Create a new poll
   * @param data - The poll data
   * @returns The created poll
   */
  async create(data: InsertPoll): Promise<Poll> {
    const result = await db
      .insert(pollsTable)
      .values(data)
      .returning();

    return result[0];
  }

  /**
   * Update a poll
   * @param pollId - The poll's UUID
   * @param updates - Fields to update
   * @returns The updated poll or null if not found
   */
  async update(
    pollId: string,
    updates: Partial<Pick<InsertPoll, 'question' | 'options' | 'votes' | 'expiresAt'>>
  ): Promise<Poll | null> {
    const result = await db
      .update(pollsTable)
      .set(updates)
      .where(eq(pollsTable.id, pollId))
      .returning();

    if (result.length === 0) {
      return null;
    }

    return result[0];
  }

  /**
   * Delete a poll
   * @param pollId - The poll's UUID
   * @returns True if deleted, false if not found
   */
  async delete(pollId: string): Promise<boolean> {
    const result = await db
      .delete(pollsTable)
      .where(eq(pollsTable.id, pollId))
      .returning();

    return result.length > 0;
  }

  /**
   * Check if a user has voted on a poll
   * @param pollId - The poll's UUID
   * @param userId - The user's UUID
   * @returns True if user has voted, false otherwise
   */
  async hasUserVoted(pollId: string, userId: string): Promise<boolean> {
    const poll = await this.getById(pollId);
    if (!poll) {
      return false;
    }

    return poll.votes.some((vote) => vote.userId === userId);
  }

  /**
   * Get a user's vote on a poll
   * @param pollId - The poll's UUID
   * @param userId - The user's UUID
   * @returns The vote or null if not found
   */
  async getUserVote(pollId: string, userId: string): Promise<PollVote | null> {
    const poll = await this.getById(pollId);
    if (!poll) {
      return null;
    }

    return poll.votes.find((vote) => vote.userId === userId) || null;
  }

  /**
   * Check if a poll has expired
   * @param pollId - The poll's UUID
   * @returns True if poll has expired, false otherwise
   */
  async isExpired(pollId: string): Promise<boolean> {
    const poll = await this.getById(pollId);
    if (!poll || !poll.expiresAt) {
      return false;
    }

    return new Date(poll.expiresAt) < new Date();
  }
}

// Export a singleton instance for convenience
export const pollRepository = new PollRepository();
