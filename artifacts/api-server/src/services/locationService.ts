import { locationRepository, type Location } from '@workspace/db';
import { audienceService } from './audienceService';

/**
 * Default location expiration time (24 hours)
 */
const DEFAULT_EXPIRATION_HOURS = 24;

/**
 * Domain types for location service
 */

export interface ShareLocationInput {
  userId: string;
  latitude: number;
  longitude: number;
  placeName?: string;
  accuracyMeters?: number;
  audienceListId?: string;
  excludedFriendIds?: string[];
  expiresAt?: Date;
}

export interface UpdateLocationInput {
  locationId: string;
  userId: string;
  audienceListId?: string | null;
  excludedFriendIds?: string[];
  expiresAt?: Date;
  enabled?: boolean;
}

export interface LocationResponse {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  placeName: string | null;
  accuracyMeters: number | null;
  sharedWithListId: string | null;
  excludedFriendIds: string[];
  enabled: boolean;
  expiresAt: string;
  updatedAt: string;
}

export interface LocationMapItem {
  userId: string;
  handle: string;
  name: string;
  avatarUrl: string | null;
  latitude: number;
  longitude: number;
  placeName: string | null;
  updatedAt: string;
  postId: string | null;
}

export interface LocationMapResponse {
  locations: LocationMapItem[];
  total: number;
}

/**
 * LocationService encapsulates location sharing business logic.
 *
 * Deep module: Hides privacy filtering, expiration logic, and audience integration
 * behind a simple interface of domain operations.
 *
 * Design decisions:
 * - Location data expires after 24h by default
 * - Users can exclude specific friends from seeing their location
 * - Location sharing respects audience list visibility
 * - Expired locations are cleaned up automatically
 */
export class LocationService {
  /**
   * Share or update a user's location
   * @param input - The location sharing data
   * @returns The shared location
   */
  async shareLocation(input: ShareLocationInput): Promise<LocationResponse> {
    // Calculate default expiration if not provided
    const expiresAt = input.expiresAt || new Date(Date.now() + DEFAULT_EXPIRATION_HOURS * 60 * 60 * 1000);

    // Check if user already has a location
    const existing = await locationRepository.getByUserId(input.userId);

    if (existing) {
      // Update existing location
      const updated = await locationRepository.update(existing.id, {
        latitude: input.latitude,
        longitude: input.longitude,
        placeName: input.placeName,
        accuracyMeters: input.accuracyMeters,
        sharedWithListId: input.audienceListId || null,
        excludedFriendIds: input.excludedFriendIds || [],
        enabled: 'true',
        expiresAt,
      });

      if (!updated) {
        throw new Error('Failed to update location');
      }

      return this.toLocationResponse(updated);
    }

    // Create new location
    const location = await locationRepository.create({
      userId: input.userId,
      latitude: input.latitude,
      longitude: input.longitude,
      placeName: input.placeName || null,
      accuracyMeters: input.accuracyMeters || null,
      sharedWithListId: input.audienceListId || null,
      excludedFriendIds: input.excludedFriendIds || [],
      enabled: 'true',
      expiresAt,
    });

    return this.toLocationResponse(location);
  }

  /**
   * Update location sharing settings
   * @param input - The update data
   * @returns The updated location or null if not found
   */
  async updateLocation(input: UpdateLocationInput): Promise<LocationResponse | null> {
    // Validate ownership
    const isOwner = await locationRepository.isOwner(input.locationId, input.userId);
    if (!isOwner) {
      throw new Error('Not authorized to update this location');
    }

    const updates: {
      sharedWithListId?: string | null;
      excludedFriendIds?: string[];
      expiresAt?: Date;
      enabled?: string;
    } = {};

    if (input.audienceListId !== undefined) updates.sharedWithListId = input.audienceListId || null;
    if (input.excludedFriendIds !== undefined) updates.excludedFriendIds = input.excludedFriendIds;
    if (input.expiresAt !== undefined) updates.expiresAt = input.expiresAt;
    if (input.enabled !== undefined) updates.enabled = input.enabled ? 'true' : 'false';

    const location = await locationRepository.update(input.locationId, updates);

    if (!location) {
      return null;
    }

    return this.toLocationResponse(location);
  }

  /**
   * Get location map of friends
   * @param viewerId - The viewer's UUID
   * @param friendIds - Array of friend UUIDs
   * @param limit - Maximum number of locations to return
   * @param offset - Number of locations to skip
   * @returns Location map with friend locations
   */
  async getLocationMap(
    viewerId: string,
    friendIds: string[],
    limit: number = 50,
    offset: number = 0
  ): Promise<LocationMapResponse> {
    const locations = await locationRepository.listByFriends(friendIds, viewerId, limit, offset);

    // Filter by audience list membership
    const filteredLocations = await Promise.all(
      locations.map(async (loc) => {
        if (!loc.sharedWithListId) {
          // Shared with all friends, check exclusions
          if (loc.excludedFriendIds.includes(viewerId)) {
            return null;
          }
          return loc;
        }

        // Shared with specific audience list
        const isMember = await audienceService.isMember(loc.sharedWithListId, viewerId);
        if (!isMember) {
          return null;
        }

        return loc;
      })
    );

    const validLocations = filteredLocations.filter((loc): loc is Location => loc !== null);

    // Convert to LocationMapItem format
    // Note: In a real implementation, you'd fetch user details (handle, name, avatarUrl)
    // from the users table. For now, we'll use placeholder data.
    const mapItems: LocationMapItem[] = validLocations.map((loc) => ({
      userId: loc.userId,
      handle: `user_${loc.userId.slice(0, 8)}`, // Placeholder
      name: `User ${loc.userId.slice(0, 8)}`, // Placeholder
      avatarUrl: null, // Placeholder
      latitude: loc.latitude,
      longitude: loc.longitude,
      placeName: loc.placeName,
      updatedAt: loc.updatedAt.toISOString(),
      postId: null, // Location-tagged content would be queried separately
    }));

    return {
      locations: mapItems,
      total: mapItems.length,
    };
  }

  /**
   * Get a user's current location
   * @param userId - The user's UUID
   * @returns The user's location or null if not found
   */
  async getUserLocation(userId: string): Promise<LocationResponse | null> {
    const location = await locationRepository.getByUserId(userId);

    if (!location) {
      return null;
    }

    return this.toLocationResponse(location);
  }

  /**
   * Clean up expired locations
   * @returns Number of locations deleted
   */
  async cleanupExpired(): Promise<number> {
    return locationRepository.deleteExpired();
  }

  /**
   * Convert a repository location to a service response
   */
  private toLocationResponse(location: Location): LocationResponse {
    return {
      id: location.id,
      userId: location.userId,
      latitude: location.latitude,
      longitude: location.longitude,
      placeName: location.placeName,
      accuracyMeters: location.accuracyMeters,
      sharedWithListId: location.sharedWithListId,
      excludedFriendIds: location.excludedFriendIds,
      enabled: location.enabled === 'true',
      expiresAt: location.expiresAt.toISOString(),
      updatedAt: location.updatedAt.toISOString(),
    };
  }
}

// Export a singleton instance for convenience
export const locationService = new LocationService();
