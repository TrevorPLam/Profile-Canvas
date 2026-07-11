import { eq } from 'drizzle-orm';
import { db } from '../index';
import { audienceListsTable, type AudienceList, type InsertAudienceList } from '../schema';

/**
 * Domain types for audience repository
 */

export interface AudienceListWithOwner extends AudienceList {
  // Additional fields can be added here if needed
}

/**
 * AudienceRepository encapsulates all audience list data access logic.
 *
 * Deep module: Hides Drizzle internals, array operations, and uniqueness constraints
 * behind a simple interface of domain operations.
 */
export class AudienceRepository {
  /**
   * Get an audience list by ID
   * @param listId - The list's UUID
   * @returns The list or null if not found
   */
  async getById(listId: string): Promise<AudienceList | null> {
    const result = await db
      .select()
      .from(audienceListsTable)
      .where(eq(audienceListsTable.id, listId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0];
  }

  /**
   * Get all audience lists for a user
   * @param ownerId - The user's UUID
   * @returns Array of audience lists
   */
  async listByOwner(ownerId: string): Promise<AudienceList[]> {
    return db
      .select()
      .from(audienceListsTable)
      .where(eq(audienceListsTable.ownerId, ownerId));
  }

  /**
   * Create a new audience list
   * @param data - The list data
   * @returns The created list
   */
  async create(data: InsertAudienceList): Promise<AudienceList> {
    const result = await db
      .insert(audienceListsTable)
      .values(data)
      .returning();

    return result[0];
  }

  /**
   * Update an audience list
   * @param listId - The list's UUID
   * @param updates - Fields to update
   * @returns The updated list or null if not found
   */
  async update(
    listId: string,
    updates: Partial<Pick<InsertAudienceList, 'name' | 'emoji' | 'memberIds'>>
  ): Promise<AudienceList | null> {
    const result = await db
      .update(audienceListsTable)
      .set(updates)
      .where(eq(audienceListsTable.id, listId))
      .returning();

    if (result.length === 0) {
      return null;
    }

    return result[0];
  }

  /**
   * Delete an audience list
   * @param listId - The list's UUID
   * @returns True if deleted, false if not found
   */
  async delete(listId: string): Promise<boolean> {
    const result = await db
      .delete(audienceListsTable)
      .where(eq(audienceListsTable.id, listId))
      .returning();

    return result.length > 0;
  }

  /**
   * Check if a user is a member of an audience list
   * @param listId - The list's UUID
   * @param userId - The user's UUID to check
   * @returns True if user is in the list, false otherwise
   */
  async isMember(listId: string, userId: string): Promise<boolean> {
    const list = await this.getById(listId);
    if (!list) {
      return false;
    }

    return list.memberIds.includes(userId);
  }

  /**
   * Get all audience lists that a user is a member of
   * @param userId - The user's UUID
   * @returns Array of audience lists the user belongs to
   */
  async listByMember(userId: string): Promise<AudienceList[]> {
    const allLists = await db.select().from(audienceListsTable);

    // Filter lists where userId is in memberIds array
    return allLists.filter((list) => list.memberIds.includes(userId));
  }

  /**
   * Check if a user owns a list
   * @param listId - The list's UUID
   * @param ownerId - The user's UUID
   * @returns True if user owns the list, false otherwise
   */
  async isOwner(listId: string, ownerId: string): Promise<boolean> {
    const list = await this.getById(listId);
    if (!list) {
      return false;
    }

    return list.ownerId === ownerId;
  }

  /**
   * Count audience lists for a user
   * @param ownerId - The user's UUID
   * @returns Number of lists owned by the user
   */
  async countByOwner(ownerId: string): Promise<number> {
    const lists = await this.listByOwner(ownerId);
    return lists.length;
  }
}

// Export a singleton instance for convenience
export const audienceRepository = new AudienceRepository();
