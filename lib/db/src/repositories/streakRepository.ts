import { eq, and } from 'drizzle-orm';
import { db } from '../index';
import { streaksTable, type Streak, type InsertStreak } from '../schema';

/**
 * Domain types for streak repository
 */

export interface StreakWithUser extends Streak {
  // Additional fields can be added here if needed
}

/**
 * StreakRepository encapsulates all streak data access logic.
 *
 * Deep module: Hides Drizzle internals, streak calculation, and reset logic
 * behind a simple interface of domain operations.
 */
export class StreakRepository {
  /**
   * Get a streak by ID
   * @param streakId - The streak's UUID
   * @returns The streak or null if not found
   */
  async getById(streakId: string): Promise<Streak | null> {
    const result = await db
      .select()
      .from(streaksTable)
      .where(eq(streaksTable.id, streakId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0];
  }

  /**
   * Get all streaks for a user
   * @param userId - The user's UUID
   * @returns Array of streaks
   */
  async listByUser(userId: string): Promise<Streak[]> {
    return db
      .select()
      .from(streaksTable)
      .where(eq(streaksTable.userId, userId));
  }

  /**
   * Get a specific streak for a user by type
   * @param userId - The user's UUID
   * @param streakType - The streak type
   * @returns The streak or null if not found
   */
  async getByUserAndType(userId: string, streakType: string): Promise<Streak | null> {
    const result = await db
      .select()
      .from(streaksTable)
      .where(and(eq(streaksTable.userId, userId), eq(streaksTable.streakType, streakType)))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0];
  }

  /**
   * Create a new streak
   * @param data - The streak data
   * @returns The created streak
   */
  async create(data: InsertStreak): Promise<Streak> {
    const result = await db
      .insert(streaksTable)
      .values(data)
      .returning();

    return result[0];
  }

  /**
   * Update a streak
   * @param streakId - The streak's UUID
   * @param updates - Fields to update
   * @returns The updated streak or null if not found
   */
  async update(
    streakId: string,
    updates: Partial<Pick<InsertStreak, 'currentCount' | 'longestCount' | 'lastActivityAt' | 'nextResetAt' | 'frozenDays'>>
  ): Promise<Streak | null> {
    const result = await db
      .update(streaksTable)
      .set(updates)
      .where(eq(streaksTable.id, streakId))
      .returning();

    if (result.length === 0) {
      return null;
    }

    return result[0];
  }

  /**
   * Delete a streak
   * @param streakId - The streak's UUID
   * @returns True if deleted, false if not found
   */
  async delete(streakId: string): Promise<boolean> {
    const result = await db
      .delete(streaksTable)
      .where(eq(streaksTable.id, streakId))
      .returning();

    return result.length > 0;
  }

  /**
   * Check if a streak has expired (past nextResetAt)
   * @param streakId - The streak's UUID
   * @returns True if streak has expired, false otherwise
   */
  async isExpired(streakId: string): Promise<boolean> {
    const streak = await this.getById(streakId);
    if (!streak || !streak.nextResetAt) {
      return false;
    }

    return new Date(streak.nextResetAt) < new Date();
  }
}

// Export a singleton instance for convenience
export const streakRepository = new StreakRepository();
