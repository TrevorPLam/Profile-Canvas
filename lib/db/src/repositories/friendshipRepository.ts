import { eq, and, or, desc } from 'drizzle-orm';
import { db } from '../index';
import {
  friendRequestsTable,
  friendshipsTable,
  type FriendRequest,
  type Friendship,
  type FriendRequestStatus,
} from '../schema';

/**
 * Domain types for friendship repository
 * These hide the underlying Drizzle table structure from callers
 */

export interface FriendRequestWithProfile {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface FriendshipWithProfile {
  userId: string;
  friendId: string;
  createdAt: Date;
}

/**
 * FriendshipRepository encapsulates all friendship data access logic.
 *
 * Deep module: Hides Drizzle internals, symmetric-row logic, and request state machine
 * behind a simple interface of domain operations.
 *
 * Design decisions:
 * - Single-row model for friendships: stores each friendship once with userId < friendId
 * - Ordering enforced in repository layer to avoid database CHECK constraint complexity
 * - Friend request state machine: pending -> accepted/declined/cancelled
 * - Symmetric friendship created on accept, deleted on remove
 */
export class FriendshipRepository {
  /**
   * Send a friend request
   * @param senderId - The user sending the request
   * @param receiverId - The user receiving the request
   * @returns The created friend request or null if duplicate exists
   */
  async sendRequest(
    senderId: string,
    receiverId: string
  ): Promise<FriendRequestWithProfile | null> {
    // Check if a pending request already exists
    const existing = await this.getRequestBetween(senderId, receiverId);
    if (existing) {
      return null;
    }

    // Check if users are already friends
    const existingFriendship = await this.getFriendshipBetween(senderId, receiverId);
    if (existingFriendship) {
      return null;
    }

    const result = await db
      .insert(friendRequestsTable)
      .values({
        senderId,
        receiverId,
        status: 'pending',
      })
      .returning();

    return this.toFriendRequestWithProfile(result[0]);
  }

  /**
   * Accept a friend request
   * @param requestId - The friend request ID
   * @returns The created friendship or null if request not found/invalid
   */
  async acceptRequest(requestId: string): Promise<FriendshipWithProfile | null> {
    const request = await db
      .select()
      .from(friendRequestsTable)
      .where(eq(friendRequestsTable.id, requestId))
      .limit(1);

    if (request.length === 0) {
      return null;
    }

    const friendRequest = request[0];

    // Only accept pending requests
    if (friendRequest.status !== 'pending') {
      return null;
    }

    // Create symmetric friendship with ordered IDs
    const [userId, friendId] = this.orderIds(friendRequest.senderId, friendRequest.receiverId);

    // Update request status to accepted
    await db
      .update(friendRequestsTable)
      .set({ status: 'accepted' })
      .where(eq(friendRequestsTable.id, requestId));

    // Create friendship
    const result = await db
      .insert(friendshipsTable)
      .values({
        userId,
        friendId,
      })
      .returning();

    return this.toFriendshipWithProfile(result[0]);
  }

  /**
   * Decline a friend request
   * @param requestId - The friend request ID
   * @returns The updated request or null if not found
   */
  async declineRequest(requestId: string): Promise<FriendRequestWithProfile | null> {
    const result = await db
      .update(friendRequestsTable)
      .set({ status: 'declined' })
      .where(eq(friendRequestsTable.id, requestId))
      .returning();

    if (result.length === 0) {
      return null;
    }

    return this.toFriendRequestWithProfile(result[0]);
  }

  /**
   * Cancel a friend request
   * @param requestId - The friend request ID
   * @returns The updated request or null if not found
   */
  async cancelRequest(requestId: string): Promise<FriendRequestWithProfile | null> {
    const result = await db
      .update(friendRequestsTable)
      .set({ status: 'cancelled' })
      .where(eq(friendRequestsTable.id, requestId))
      .returning();

    if (result.length === 0) {
      return null;
    }

    return this.toFriendRequestWithProfile(result[0]);
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
  ): Promise<FriendRequestWithProfile[]> {
    const results = await db
      .select()
      .from(friendRequestsTable)
      .where(
        and(
          type === 'incoming'
            ? eq(friendRequestsTable.receiverId, userId)
            : eq(friendRequestsTable.senderId, userId),
          eq(friendRequestsTable.status, 'pending')
        )
      )
      .orderBy(desc(friendRequestsTable.createdAt));

    return results.map((r) => this.toFriendRequestWithProfile(r));
  }

  /**
   * Get all friends for a user
   * @param userId - The user's UUID
   * @returns List of friendships
   */
  async listFriends(userId: string): Promise<FriendshipWithProfile[]> {
    // Query both userId and friendId columns since we use single-row model
    const results = await db
      .select()
      .from(friendshipsTable)
      .where(or(eq(friendshipsTable.userId, userId), eq(friendshipsTable.friendId, userId)))
      .orderBy(desc(friendshipsTable.createdAt));

    return results.map((r) => this.toFriendshipWithProfile(r));
  }

  /**
   * Remove a friendship
   * @param userId - One user's UUID
   * @param friendId - The other user's UUID
   * @returns True if friendship was removed, false if not found
   */
  async removeFriend(userId: string, friendId: string): Promise<boolean> {
    const [orderedUserId, orderedFriendId] = this.orderIds(userId, friendId);

    const result = await db
      .delete(friendshipsTable)
      .where(
        and(
          eq(friendshipsTable.userId, orderedUserId),
          eq(friendshipsTable.friendId, orderedFriendId)
        )
      )
      .returning();

    return result.length > 0;
  }

  /**
   * Check if two users are friends
   * @param userId - One user's UUID
   * @param friendId - The other user's UUID
   * @returns True if friends, false otherwise
   */
  async areFriends(userId: string, friendId: string): Promise<boolean> {
    const friendship = await this.getFriendshipBetween(userId, friendId);
    return friendship !== null;
  }

  /**
   * Get a friend request between two users
   * @param userId - One user's UUID
   * @param otherUserId - The other user's UUID
   * @returns The friend request or null if not found
   */
  private async getRequestBetween(
    userId: string,
    otherUserId: string
  ): Promise<FriendRequest | null> {
    const result = await db
      .select()
      .from(friendRequestsTable)
      .where(
        and(
          or(
            and(
              eq(friendRequestsTable.senderId, userId),
              eq(friendRequestsTable.receiverId, otherUserId)
            ),
            and(
              eq(friendRequestsTable.senderId, otherUserId),
              eq(friendRequestsTable.receiverId, userId)
            )
          ),
          eq(friendRequestsTable.status, 'pending')
        )
      )
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Get a friendship between two users
   * @param userId - One user's UUID
   * @param friendId - The other user's UUID
   * @returns The friendship or null if not found
   */
  private async getFriendshipBetween(userId: string, friendId: string): Promise<Friendship | null> {
    const [orderedUserId, orderedFriendId] = this.orderIds(userId, friendId);

    const result = await db
      .select()
      .from(friendshipsTable)
      .where(
        and(
          eq(friendshipsTable.userId, orderedUserId),
          eq(friendshipsTable.friendId, orderedFriendId)
        )
      )
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Order two UUIDs to ensure consistent storage
   * @param id1 - First UUID
   * @param id2 - Second UUID
   * @returns Tuple with [smallerId, largerId]
   */
  private orderIds(id1: string, id2: string): [string, string] {
    return id1 < id2 ? [id1, id2] : [id2, id1];
  }

  /**
   * Convert a Drizzle friend request row to a domain FriendRequestWithProfile
   */
  private toFriendRequestWithProfile(request: FriendRequest): FriendRequestWithProfile {
    return {
      id: request.id,
      senderId: request.senderId,
      receiverId: request.receiverId,
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };
  }

  /**
   * Convert a Drizzle friendship row to a domain FriendshipWithProfile
   */
  private toFriendshipWithProfile(friendship: Friendship): FriendshipWithProfile {
    return {
      userId: friendship.userId,
      friendId: friendship.friendId,
      createdAt: friendship.createdAt,
    };
  }
}

// Export a singleton instance for convenience
export const friendshipRepository = new FriendshipRepository();
