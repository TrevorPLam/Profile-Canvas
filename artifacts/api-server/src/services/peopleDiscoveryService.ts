import { profileRepository } from '@workspace/db';
import { friendshipRepository } from '@workspace/db';

/**
 * Domain types for people discovery service
 */

export interface SuggestedProfile {
  userId: string;
  handle: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
}

export interface PeopleSuggestionsResponse {
  profiles: SuggestedProfile[];
  total: number;
}

export interface ProfileSearchResponse {
  profiles: SuggestedProfile[];
  total: number;
}

/**
 * PeopleDiscoveryService encapsulates people discovery business logic.
 *
 * Deep module: Hides exclusion logic (friends, pending requests, self) behind
 * a simple interface of domain operations.
 *
 * Design decisions:
 * - Excludes current user from suggestions
 * - Excludes existing friends from suggestions
 * - Excludes users with pending friend requests from suggestions
 * - Handle search returns matching profiles (privacy enforced at profile visibility level)
 * - Simple random ordering for suggestions (advanced mutual friend algorithms deferred)
 */
export class PeopleDiscoveryService {
  /**
   * Get suggested users for a user
   * @param userId - The user's UUID
   * @param limit - Maximum number of suggestions to return
   * @param offset - Pagination offset
   * @returns List of suggested users excluding friends and pending requests
   */
  async getSuggestions(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<PeopleSuggestionsResponse> {
    // Get list of friends
    const friends = await friendshipRepository.listFriends(userId);
    const friendIds = friends.map((f) => (f.userId === userId ? f.friendId : f.userId));

    // Get list of pending friend requests (both incoming and outgoing)
    const incomingRequests = await friendshipRepository.listRequests(userId, 'incoming');
    const outgoingRequests = await friendshipRepository.listRequests(userId, 'outgoing');

    const pendingUserIds = new Set<string>();
    incomingRequests.forEach((r) => pendingUserIds.add(r.senderId));
    outgoingRequests.forEach((r) => pendingUserIds.add(r.receiverId));

    // Get all profiles (in production, this should be paginated at the database level)
    // For now, we'll fetch all and filter in memory (acceptable for MVP)
    const allProfiles = await profileRepository.listAll();

    // Filter out: self, friends, pending requests
    const suggestedProfiles = allProfiles
      .filter(
        (profile: {
          userId: string;
          handle: string;
          name: string;
          avatarUrl: string | null;
          bio: string | null;
        }) => {
          // Exclude self
          if (profile.userId === userId) return false;

          // Exclude friends
          if (friendIds.includes(profile.userId)) return false;

          // Exclude users with pending requests
          if (pendingUserIds.has(profile.userId)) return false;

          return true;
        }
      )
      .map(
        (profile: {
          userId: string;
          handle: string;
          name: string;
          avatarUrl: string | null;
          bio: string | null;
        }) => ({
          userId: profile.userId,
          handle: profile.handle,
          name: profile.name,
          avatarUrl: profile.avatarUrl,
          bio: profile.bio,
        })
      );

    // Apply pagination
    const total = suggestedProfiles.length;
    const paginatedProfiles = suggestedProfiles.slice(offset, offset + limit);

    return {
      profiles: paginatedProfiles,
      total,
    };
  }

  /**
   * Search profiles by handle
   * @param query - Search query for handle
   * @param limit - Maximum number of results to return
   * @param offset - Pagination offset
   * @returns List of matching profiles
   */
  async searchProfiles(
    query: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ProfileSearchResponse> {
    if (!query || query.trim().length === 0) {
      return {
        profiles: [],
        total: 0,
      };
    }

    // Get all profiles and filter by handle (case-insensitive partial match)
    // In production, this should use database ILIKE for better performance
    const allProfiles = await profileRepository.listAll();

    const searchLower = query.toLowerCase().trim();
    const matchingProfiles = allProfiles
      .filter(
        (profile: {
          userId: string;
          handle: string;
          name: string;
          avatarUrl: string | null;
          bio: string | null;
        }) => profile.handle.toLowerCase().includes(searchLower)
      )
      .map(
        (profile: {
          userId: string;
          handle: string;
          name: string;
          avatarUrl: string | null;
          bio: string | null;
        }) => ({
          userId: profile.userId,
          handle: profile.handle,
          name: profile.name,
          avatarUrl: profile.avatarUrl,
          bio: profile.bio,
        })
      );

    // Apply pagination
    const total = matchingProfiles.length;
    const paginatedProfiles = matchingProfiles.slice(offset, offset + limit);

    return {
      profiles: paginatedProfiles,
      total,
    };
  }
}

// Export a singleton instance for convenience
export const peopleDiscoveryService = new PeopleDiscoveryService();
