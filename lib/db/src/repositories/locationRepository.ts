import { eq, and, gt, lt } from 'drizzle-orm';
import { db } from '../index';
import { locationsTable, type Location, type InsertLocation } from '../schema';

/**
 * Domain types for location repository
 */

export interface LocationWithUser extends Location {
  // Additional fields can be added here if needed
}

/**
 * LocationRepository encapsulates all location data access logic.
 *
 * Deep module: Hides Drizzle internals, expiration queries, and privacy filtering
 * behind a simple interface of domain operations.
 */
export class LocationRepository {
  /**
   * Get a location by ID
   * @param locationId - The location's UUID
   * @returns The location or null if not found
   */
  async getById(locationId: string): Promise<Location | null> {
    const result = await db
      .select()
      .from(locationsTable)
      .where(eq(locationsTable.id, locationId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0];
  }

  /**
   * Get the current location for a user
   * @param userId - The user's UUID
   * @returns The user's location or null if not found
   */
  async getByUserId(userId: string): Promise<Location | null> {
    const result = await db
      .select()
      .from(locationsTable)
      .where(eq(locationsTable.userId, userId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0];
  }

  /**
   * Create a new location
   * @param data - The location data
   * @returns The created location
   */
  async create(data: InsertLocation): Promise<Location> {
    const result = await db
      .insert(locationsTable)
      .values(data)
      .returning();

    return result[0];
  }

  /**
   * Update a location
   * @param locationId - The location's UUID
   * @param updates - Fields to update
   * @returns The updated location or null if not found
   */
  async update(
    locationId: string,
    updates: Partial<
      Pick<
        InsertLocation,
        | 'latitude'
        | 'longitude'
        | 'placeName'
        | 'accuracyMeters'
        | 'sharedWithListId'
        | 'excludedFriendIds'
        | 'enabled'
        | 'expiresAt'
      >
    >
  ): Promise<Location | null> {
    const result = await db
      .update(locationsTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(locationsTable.id, locationId))
      .returning();

    if (result.length === 0) {
      return null;
    }

    return result[0];
  }

  /**
   * Delete a location
   * @param locationId - The location's UUID
   * @returns True if deleted, false if not found
   */
  async delete(locationId: string): Promise<boolean> {
    const result = await db
      .delete(locationsTable)
      .where(eq(locationsTable.id, locationId))
      .returning();

    return result.length > 0;
  }

  /**
   * Get all active (non-expired) locations
   * @param limit - Maximum number of locations to return
   * @param offset - Number of locations to skip
   * @returns Array of active locations
   */
  async listActive(limit: number = 50, offset: number = 0): Promise<Location[]> {
    const now = new Date();
    return db
      .select()
      .from(locationsTable)
      .where(
        and(
          gt(locationsTable.expiresAt, now),
          eq(locationsTable.enabled, 'true')
        )
      )
      .limit(limit)
      .offset(offset);
  }

  /**
   * Get active locations for friends of a user
   * @param friendIds - Array of friend UUIDs
   * @param viewerId - The viewer's UUID (for privacy filtering)
   * @param limit - Maximum number of locations to return
   * @param offset - Number of locations to skip
   * @returns Array of friend locations
   */
  async listByFriends(
    friendIds: string[],
    viewerId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Location[]> {
    const now = new Date();
    
    if (friendIds.length === 0) {
      return [];
    }

    // Get all active locations for friends
    const locations = await db
      .select()
      .from(locationsTable)
      .where(
        and(
          eq(locationsTable.enabled, 'true'),
          gt(locationsTable.expiresAt, now)
        )
      );

    // Filter by friend IDs and privacy rules
    return locations
      .filter((loc) => friendIds.includes(loc.userId))
      .filter((loc) => {
        // If sharedWithListId is null, location is shared with all friends
        if (!loc.sharedWithListId) {
          // Check if viewer is excluded
          return !loc.excludedFriendIds.includes(viewerId);
        }

        // If sharedWithListId is set, viewer must be in that list
        // This check is handled at the service layer with audienceService
        return true;
      })
      .slice(offset, offset + limit);
  }

  /**
   * Get expired locations for cleanup
   * @param limit - Maximum number of locations to return
   * @returns Array of expired locations
   */
  async listExpired(limit: number = 100): Promise<Location[]> {
    const now = new Date();
    return db
      .select()
      .from(locationsTable)
      .where(lt(locationsTable.expiresAt, now))
      .limit(limit);
  }

  /**
   * Delete expired locations
   * @returns Number of locations deleted
   */
  async deleteExpired(): Promise<number> {
    const now = new Date();
    const result = await db
      .delete(locationsTable)
      .where(lt(locationsTable.expiresAt, now))
      .returning();

    return result.length;
  }

  /**
   * Check if a user owns a location
   * @param locationId - The location's UUID
   * @param userId - The user's UUID
   * @returns True if user owns the location, false otherwise
   */
  async isOwner(locationId: string, userId: string): Promise<boolean> {
    const location = await this.getById(locationId);
    if (!location) {
      return false;
    }

    return location.userId === userId;
  }
}

// Export a singleton instance for convenience
export const locationRepository = new LocationRepository();
