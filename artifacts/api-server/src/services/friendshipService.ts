import { friendshipRepository } from '@workspace/db';
import { profileRepository } from '@workspace/db';
import type { FriendRequestWithProfile, FriendshipWithProfile } from '@workspace/db';
import { notificationService } from './notificationService';

/**
 * Maximum number of top friends allowed
 */
const MAX_TOP_FRIENDS = 8;

/**
 * Domain types for friendship service
 */

export interface FriendProfile {
  userId: string;
  handle: string;
  name: string;
  avatarUrl: string | null;
}

export interface FriendRequestResponse {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface FriendshipResponse {
  userId: string;
  friendId: string;
  createdAt: string;
}

export interface FriendListResponse {
  friends: FriendProfile[];
  total: number;
}

export interface FriendRequestListResponse {
  requests: FriendRequestResponse[];
  total: number;
}

/**
 * FriendshipService encapsulates friendship business logic.
 *
 * Deep module: Hides state transitions, symmetric rows, and top-friends validation
 * behind a simple interface of domain operations.
 *
 * Design decisions:
 * - Validates authorization rules (only recipient can accept/decline, only sender can cancel)
 * - Validates top-friends are subset of friends
 * - Enforces maximum top-friends count
 * - Loads profile information for friend lists
 */
export class FriendshipService {
  /**
   * Send a friend request
   * @param senderId - The user sending the request
   * @param receiverId - The user receiving the request
   * @returns The created friend request or null if duplicate exists
   */
  async sendRequest(
    senderId: string,
    receiverId: string
  ): Promise<FriendRequestResponse | null> {
    // Prevent self-friend requests
    if (senderId === receiverId) {
      throw new Error('Cannot send friend request to yourself');
    }

    const result = await friendshipRepository.sendRequest(senderId, receiverId);

    if (!result) {
      return null;
    }

    // Create notification for the receiver
    await notificationService.create({
      recipientId: receiverId,
      actorId: senderId,
      type: 'friendRequest',
    });

    return this.toFriendRequestResponse(result);
  }

  /**
   * Accept a friend request
   * @param requestId - The friend request ID
   * @param recipientId - The user accepting the request (must be the receiver)
   * @returns The created friendship or null if request not found/invalid
   */
  async acceptRequest(
    requestId: string,
    recipientId: string
  ): Promise<FriendshipResponse | null> {
    // Get the request to validate authorization
    const request = await this.getRequestById(requestId);
    if (!request) {
      return null;
    }

    // Only the recipient can accept
    if (request.receiverId !== recipientId) {
      throw new Error('Not authorized to accept this request');
    }

    const result = await friendshipRepository.acceptRequest(requestId);

    if (!result) {
      return null;
    }

    // Create notification for the sender that their request was accepted
    await notificationService.create({
      recipientId: request.senderId,
      actorId: recipientId,
      type: 'friendAccepted',
    });

    return this.toFriendshipResponse(result);
  }

  /**
   * Decline a friend request
   * @param requestId - The friend request ID
   * @param recipientId - The user declining the request (must be the receiver)
   * @returns The updated request or null if not found
   */
  async declineRequest(
    requestId: string,
    recipientId: string
  ): Promise<FriendRequestResponse | null> {
    // Get the request to validate authorization
    const request = await this.getRequestById(requestId);
    if (!request) {
      return null;
    }

    // Only the recipient can decline
    if (request.receiverId !== recipientId) {
      throw new Error('Not authorized to decline this request');
    }

    const result = await friendshipRepository.declineRequest(requestId);

    if (!result) {
      return null;
    }

    return this.toFriendRequestResponse(result);
  }

  /**
   * Cancel a friend request
   * @param requestId - The friend request ID
   * @param senderId - The user canceling the request (must be the sender)
   * @returns The updated request or null if not found
   */
  async cancelRequest(
    requestId: string,
    senderId: string
  ): Promise<FriendRequestResponse | null> {
    // Get the request to validate authorization
    const request = await this.getRequestById(requestId);
    if (!request) {
      return null;
    }

    // Only the sender can cancel
    if (request.senderId !== senderId) {
      throw new Error('Not authorized to cancel this request');
    }

    const result = await friendshipRepository.cancelRequest(requestId);

    if (!result) {
      return null;
    }

    return this.toFriendRequestResponse(result);
  }

  /**
   * Get friend requests for a user
   * @param userId - The user's UUID
   * @param type - 'incoming' or 'outgoing' requests
   * @returns List of friend requests
   */
  async listRequests(
    userId: string,
    type: 'incoming' | 'outgoing'
  ): Promise<FriendRequestListResponse> {
    const requests = await friendshipRepository.listRequests(userId, type);

    return {
      requests: requests.map((r) => this.toFriendRequestResponse(r)),
      total: requests.length,
    };
  }

  /**
   * Get all friends for a user with profile information
   * @param userId - The user's UUID
   * @returns List of friends with profiles
   */
  async listFriends(userId: string): Promise<FriendListResponse> {
    const friendships = await friendshipRepository.listFriends(userId);

    // Extract friend IDs (either userId or friendId could be the current user)
    const friendIds = friendships.map((f) =>
      f.userId === userId ? f.friendId : f.userId
    );

    // Load profiles for all friends
    const profiles = await profileRepository.getByUserIds(friendIds);

    const friends: FriendProfile[] = [];
    for (const friendship of friendships) {
      const friendId = friendship.userId === userId ? friendship.friendId : friendship.userId;
      const profile = profiles.get(friendId);

      if (profile) {
        friends.push({
          userId: friendId,
          handle: profile.handle,
          name: profile.name,
          avatarUrl: profile.avatarUrl,
        });
      }
    }

    return {
      friends,
      total: friends.length,
    };
  }

  /**
   * Remove a friendship
   * @param userId - One user's UUID
   * @param friendId - The other user's UUID
   * @returns True if friendship was removed, false if not found
   */
  async removeFriend(userId: string, friendId: string): Promise<boolean> {
    return friendshipRepository.removeFriend(userId, friendId);
  }

  /**
   * Set top friends for a user
   * @param userId - The user's UUID
   * @param topFriendIds - Array of friend IDs to set as top friends
   * @returns Updated profile or null if not found
   */
  async setTopFriends(
    userId: string,
    topFriendIds: string[]
  ): Promise<{ topFriends: string[] } | null> {
    // Validate maximum count
    if (topFriendIds.length > MAX_TOP_FRIENDS) {
      throw new Error(
        `Cannot have more than ${MAX_TOP_FRIENDS} top friends`
      );
    }

    // Validate all IDs are unique
    const uniqueIds = new Set(topFriendIds);
    if (uniqueIds.size !== topFriendIds.length) {
      throw new Error('Top friends must be unique');
    }

    // Validate all top friends are actually friends
    const friends = await friendshipRepository.listFriends(userId);
    const friendIds = friends.map((f) =>
      f.userId === userId ? f.friendId : f.userId
    );
    const friendIdSet = new Set(friendIds);

    for (const topFriendId of topFriendIds) {
      if (!friendIdSet.has(topFriendId)) {
        throw new Error('Top friends must be a subset of friends');
      }
    }

    // Update profile with top friends
    const profile = await profileRepository.getByUserId(userId);
    if (!profile) {
      return null;
    }

    // Update the topFriends module with the new data
    const updatedModuleSettings = profile.moduleSettings.map((module) => {
      if (module.id === 'topFriends') {
        return {
          ...module,
          data: { topFriends: topFriendIds },
        };
      }
      return module;
    });

    const updatedProfile = await profileRepository.update(userId, {
      moduleSettings: updatedModuleSettings,
    });

    if (!updatedProfile) {
      return null;
    }

    return {
      topFriends: topFriendIds,
    };
  }

  /**
   * Get top friends for a user
   * @param userId - The user's UUID
   * @returns Array of top friend IDs
   */
  async getTopFriends(userId: string): Promise<{ topFriends: string[] } | null> {
    const profile = await profileRepository.getByUserId(userId);
    if (!profile) {
      return null;
    }

    const topFriendsModule = profile.moduleSettings.find(
      (m) => m.id === 'topFriends'
    );

    const topFriends = Array.isArray(topFriendsModule?.data?.topFriends)
      ? (topFriendsModule.data.topFriends as string[])
      : [];

    return {
      topFriends,
    };
  }

  /**
   * Check if two users are friends
   * @param userId - One user's UUID
   * @param friendId - The other user's UUID
   * @returns True if friends, false otherwise
   */
  async areFriends(userId: string, friendId: string): Promise<boolean> {
    return friendshipRepository.areFriends(userId, friendId);
  }

  /**
   * Get a friend request by ID
   * @param requestId - The friend request ID
   * @returns The friend request or null if not found
   */
  private async getRequestById(
    requestId: string
  ): Promise<FriendRequestWithProfile | null> {
    // This is a simplified implementation - in a real system we'd add a getById method to the repository
    // For now, we'll work with the existing repository interface
    // We need to query the database directly since FriendshipRepository doesn't have getById
    const { db } = await import('@workspace/db');
    const { friendRequestsTable } = await import('@workspace/db');
    const { eq } = await import('drizzle-orm');

    const result = await db
      .select()
      .from(friendRequestsTable)
      .where(eq(friendRequestsTable.id, requestId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return {
      id: result[0].id,
      senderId: result[0].senderId,
      receiverId: result[0].receiverId,
      status: result[0].status,
      createdAt: result[0].createdAt,
      updatedAt: result[0].updatedAt,
    };
  }

  /**
   * Convert a repository friend request to a service response
   */
  private toFriendRequestResponse(
    request: FriendRequestWithProfile
  ): FriendRequestResponse {
    return {
      id: request.id,
      senderId: request.senderId,
      receiverId: request.receiverId,
      status: request.status,
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString(),
    };
  }

  /**
   * Convert a repository friendship to a service response
   */
  private toFriendshipResponse(
    friendship: FriendshipWithProfile
  ): FriendshipResponse {
    return {
      userId: friendship.userId,
      friendId: friendship.friendId,
      createdAt: friendship.createdAt.toISOString(),
    };
  }
}

// Export a singleton instance for convenience
export const friendshipService = new FriendshipService();
