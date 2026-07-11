import { eq, and } from 'drizzle-orm';
import { db } from '../index';
import { userBadgesTable, type UserBadge, type InsertUserBadge } from '../schema';

/**
 * Domain types for badge repository
 */

export interface UserBadgeWithUser extends UserBadge {
  // Additional fields can be added here if needed
}

/**
 * BadgeRepository encapsulates all badge data access logic.
 *
 * Deep module: Hides Drizzle internals, badge criteria checking, and award logic
 * behind a simple interface of domain operations.
 */
export class BadgeRepository {
  /**
   * Get a user badge by ID
   * @param badgeId - The badge's UUID
   * @returns The badge or null if not found
   */
  async getById(badgeId: string): Promise<UserBadge | null> {
    const result = await db
      .select()
      .from(userBadgesTable)
      .where(eq(userBadgesTable.id, badgeId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0];
  }

  /**
   * Get all badges for a user
   * @param userId - The user's UUID
   * @returns Array of user badges
   */
  async listByUser(userId: string): Promise<UserBadge[]> {
    return db
      .select()
      .from(userBadgesTable)
      .where(eq(userBadgesTable.userId, userId))
      .orderBy(userBadgesTable.awardedAt);
  }

  /**
   * Check if a user has a specific badge
   * @param userId - The user's UUID
   * @param badgeId - The badge definition ID
   * @returns True if user has the badge, false otherwise
   */
  async hasBadge(userId: string, badgeId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(userBadgesTable)
      .where(and(eq(userBadgesTable.userId, userId), eq(userBadgesTable.badgeId, badgeId)))
      .limit(1);

    return result.length > 0;
  }

  /**
   * Create a new user badge
   * @param data - The badge data
   * @returns The created badge
   */
  async create(data: InsertUserBadge): Promise<UserBadge> {
    const result = await db
      .insert(userBadgesTable)
      .values(data)
      .returning();

    return result[0];
  }

  /**
   * Delete a user badge
   * @param badgeId - The badge's UUID
   * @returns True if deleted, false if not found
   */
  async delete(badgeId: string): Promise<boolean> {
    const result = await db
      .delete(userBadgesTable)
      .where(eq(userBadgesTable.id, badgeId))
      .returning();

    return result.length > 0;
  }

  /**
   * Count badges for a user
   * @param userId - The user's UUID
   * @returns Number of badges earned by the user
   */
  async countByUser(userId: string): Promise<number> {
    const badges = await this.listByUser(userId);
    return badges.length;
  }
}

// Export a singleton instance for convenience
export const badgeRepository = new BadgeRepository();
