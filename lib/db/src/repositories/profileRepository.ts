import { eq, inArray } from 'drizzle-orm';
import { db } from '../index';
import { profilesTable, type Profile, type ProfileModule } from '../schema';
import { visibleModulesFor as domainVisibleModulesFor } from '../domain/profileVisibility';

/**
 * Domain types for profile repository
 * These hide the underlying Drizzle table structure from callers
 */

export interface VisibleProfile {
  userId: string;
  handle: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  wallpaper: string | null;
  accentColor: string | null;
  moodLabel: string | null;
  moodIcon: string | null;
  nowPlaying: string | null;
  moduleSettings: ProfileModule[];
  joinedAt: Date;
}

export interface ProfileUpdateInput {
  name?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  wallpaper?: string | null;
  accentColor?: string | null;
  moodLabel?: string | null;
  moodIcon?: string | null;
  nowPlaying?: string | null;
  moduleSettings?: ProfileModule[];
}

/**
 * ProfileRepository encapsulates all profile data access logic.
 * 
 * Deep module: Hides Drizzle internals, JSONB parsing, joins, and transactions
 * behind a simple interface of domain operations.
 */
export class ProfileRepository {
  /**
   * Get a profile by user ID
   * @param userId - The user's UUID
   * @returns The profile or null if not found
   */
  async getByUserId(userId: string): Promise<VisibleProfile | null> {
    const result = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.userId, userId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toVisibleProfile(result[0]);
  }

  /**
   * Get a profile by handle
   * @param handle - The unique profile handle
   * @returns The profile or null if not found
   */
  async getByHandle(handle: string): Promise<VisibleProfile | null> {
    const result = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.handle, handle))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toVisibleProfile(result[0]);
  }

  /**
   * Get multiple profiles by user IDs in a single query
   * @param userIds - Array of user UUIDs
   * @returns Map of userId to profile (only profiles that exist)
   */
  async getByUserIds(userIds: string[]): Promise<Map<string, VisibleProfile>> {
    if (userIds.length === 0) {
      return new Map();
    }

    const results = await db
      .select()
      .from(profilesTable)
      .where(inArray(profilesTable.userId, userIds));

    const map = new Map<string, VisibleProfile>();
    for (const profile of results) {
      map.set(profile.userId, this.toVisibleProfile(profile));
    }

    return map;
  }

  /**
   * Create a default profile for a new user
   * @param userId - The user's UUID
   * @param handle - The unique handle for the profile
   * @param name - The display name
   * @returns The created profile
   */
  async createDefaultForUser(
    userId: string,
    handle: string,
    name: string
  ): Promise<VisibleProfile> {
    const defaultModuleSettings: ProfileModule[] = [
      { id: 'about', visible: true, visibility: 'everyone', order: 0 },
      { id: 'topFriends', visible: true, visibility: 'friends', order: 1 },
      { id: 'mood', visible: true, visibility: 'everyone', order: 2 },
      { id: 'posts', visible: true, visibility: 'everyone', order: 3 },
    ];

    const result = await db
      .insert(profilesTable)
      .values({
        userId,
        handle,
        name,
        moduleSettings: defaultModuleSettings,
      })
      .returning();

    return this.toVisibleProfile(result[0]);
  }

  /**
   * Update a profile's fields and module settings atomically
   * @param userId - The user's UUID
   * @param updates - Fields to update
   * @returns The updated profile or null if not found
   */
  async update(
    userId: string,
    updates: ProfileUpdateInput
  ): Promise<VisibleProfile | null> {
    const result = await db
      .update(profilesTable)
      .set(updates)
      .where(eq(profilesTable.userId, userId))
      .returning();

    if (result.length === 0) {
      return null;
    }

    return this.toVisibleProfile(result[0]);
  }

  /**
   * Convert a Drizzle profile row to a domain VisibleProfile
   * This encapsulates the mapping logic
   */
  private toVisibleProfile(profile: Profile): VisibleProfile {
    return {
      userId: profile.userId,
      handle: profile.handle,
      name: profile.name,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      wallpaper: profile.wallpaper,
      accentColor: profile.accentColor,
      moodLabel: profile.moodLabel,
      moodIcon: profile.moodIcon,
      nowPlaying: profile.nowPlaying,
      moduleSettings: profile.moduleSettings,
      joinedAt: profile.joinedAt,
    };
  }
}


// Export a singleton instance for convenience
export const profileRepository = new ProfileRepository();

// Re-export domain helper for convenience
export { domainVisibleModulesFor as visibleModulesFor };
