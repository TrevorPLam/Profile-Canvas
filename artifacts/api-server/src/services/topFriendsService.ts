import { db, topFriendsTable } from '@workspace/db';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { friendshipService } from './friendshipService';

/**
 * Maximum number of top friends allowed
 */
const MAX_TOP_FRIENDS = 8;

/**
 * Domain types for top friends service
 */

export interface TopFriendResponse {
  id: string;
  userId: string;
  friendId: string;
  order: number;
  addedAt: string;
  removedAt: string | null;
}

export interface TopFriendWithProfile {
  id: string;
  friendId: string;
  order: number;
  addedAt: string;
  removedAt: string | null;
  friend: {
    userId: string;
    handle: string;
    name: string;
    avatarUrl: string | null;
  };
}

export interface TopFriendsHistoryResponse {
  userId: string;
  currentTopFriends: TopFriendWithProfile[];
  history: TopFriendWithProfile[];
}

/**
 * TopFriendsService encapsulates top friends business logic with history tracking.
 *
 * Deep module: Hides ordering logic, history tracking, and friend validation
 * behind a simple interface of domain operations.
 *
 * Design decisions:
 * - Validates top friends are subset of friends
 * - Enforces maximum top-friends count
 * - Tracks history of additions and removals via removedAt timestamp
 * - Maintains 1-indexed ordering without gaps
 * - Returns current top friends and historical changes
 */
export class TopFriendsService {
  /**
   * Set top friends for a user with ordering
   * @param userId - The user's UUID
   * @param topFriendIds - Array of friend IDs in desired order (1-indexed)
   * @returns Updated top friends list
   */
  async setTopFriends(userId: string, topFriendIds: string[]): Promise<TopFriendWithProfile[]> {
    // Validate maximum count
    if (topFriendIds.length > MAX_TOP_FRIENDS) {
      throw new Error(`Cannot have more than ${MAX_TOP_FRIENDS} top friends`);
    }

    // Validate all IDs are unique
    const uniqueIds = new Set(topFriendIds);
    if (uniqueIds.size !== topFriendIds.length) {
      throw new Error('Top friends must be unique');
    }

    // Validate all top friends are actually friends
    const friends = await friendshipService.listFriends(userId);
    const friendIdSet = new Set(friends.friends.map((f) => f.userId));

    for (const topFriendId of topFriendIds) {
      if (!friendIdSet.has(topFriendId)) {
        throw new Error('Top friends must be a subset of friends');
      }
    }

    // Get current top friends to detect changes
    const currentTopFriends = await this.getCurrentTopFriends(userId);

    // Soft-remove friends that are no longer in the list
    for (const current of currentTopFriends) {
      if (!topFriendIds.includes(current.friendId)) {
        await db
          .update(topFriendsTable)
          .set({ removedAt: new Date() })
          .where(
            and(
              eq(topFriendsTable.userId, userId),
              eq(topFriendsTable.friendId, current.friendId),
              isNull(topFriendsTable.removedAt)
            )
          );
      }
    }

    // Add or update friends in the new list
    for (let i = 0; i < topFriendIds.length; i++) {
      const friendId = topFriendIds[i];
      const order = i + 1; // 1-indexed

      const existing = await db
        .select()
        .from(topFriendsTable)
        .where(
          and(
            eq(topFriendsTable.userId, userId),
            eq(topFriendsTable.friendId, friendId),
            isNull(topFriendsTable.removedAt)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update order if changed
        if (existing[0].order !== order) {
          await db
            .update(topFriendsTable)
            .set({ order })
            .where(eq(topFriendsTable.id, existing[0].id));
        }
      } else {
        // Insert new top friend
        await db.insert(topFriendsTable).values({
          userId,
          friendId,
          order,
          addedAt: new Date(),
        });
      }
    }

    return this.getCurrentTopFriends(userId);
  }

  /**
   * Get current top friends for a user with profile information
   * @param userId - The user's UUID
   * @returns Array of current top friends with profiles
   */
  async getCurrentTopFriends(userId: string): Promise<TopFriendWithProfile[]> {
    const topFriends = await db
      .select()
      .from(topFriendsTable)
      .where(and(eq(topFriendsTable.userId, userId), isNull(topFriendsTable.removedAt)))
      .orderBy(topFriendsTable.order);

    // Load friend profiles
    const friendIds = topFriends.map((tf) => tf.friendId);
    const friends = await friendshipService.listFriends(userId);
    const friendMap = new Map(friends.friends.map((f) => [f.userId, f]));

    const result: TopFriendWithProfile[] = [];
    for (const topFriend of topFriends) {
      const friend = friendMap.get(topFriend.friendId);
      if (friend) {
        result.push({
          id: topFriend.id,
          friendId: topFriend.friendId,
          order: topFriend.order,
          addedAt: topFriend.addedAt.toISOString(),
          removedAt: topFriend.removedAt?.toISOString() || null,
          friend,
        });
      }
    }

    return result;
  }

  /**
   * Get top friends history for a user
   * @param userId - The user's UUID
   * @returns Current top friends and historical changes
   */
  async getHistory(userId: string): Promise<TopFriendsHistoryResponse> {
    const currentTopFriends = await this.getCurrentTopFriends(userId);

    // Get all historical top friends (including removed ones)
    const allTopFriends = await db
      .select()
      .from(topFriendsTable)
      .where(eq(topFriendsTable.userId, userId))
      .orderBy(desc(topFriendsTable.addedAt));

    // Load friend profiles
    const friends = await friendshipService.listFriends(userId);
    const friendMap = new Map(friends.friends.map((f) => [f.userId, f]));

    const history: TopFriendWithProfile[] = [];
    for (const topFriend of allTopFriends) {
      const friend = friendMap.get(topFriend.friendId);
      if (friend) {
        history.push({
          id: topFriend.id,
          friendId: topFriend.friendId,
          order: topFriend.order,
          addedAt: topFriend.addedAt.toISOString(),
          removedAt: topFriend.removedAt?.toISOString() || null,
          friend,
        });
      }
    }

    return {
      userId,
      currentTopFriends,
      history,
    };
  }

  /**
   * Remove a friend from top friends
   * @param userId - The user's UUID
   * @param friendId - The friend's UUID to remove
   * @returns Updated top friends list
   */
  async removeTopFriend(userId: string, friendId: string): Promise<TopFriendWithProfile[]> {
    await db
      .update(topFriendsTable)
      .set({ removedAt: new Date() })
      .where(
        and(
          eq(topFriendsTable.userId, userId),
          eq(topFriendsTable.friendId, friendId),
          isNull(topFriendsTable.removedAt)
        )
      );

    // Reorder remaining friends to maintain 1-indexed order without gaps
    const remaining = await this.getCurrentTopFriends(userId);
    for (let i = 0; i < remaining.length; i++) {
      const newOrder = i + 1;
      if (remaining[i].order !== newOrder) {
        await db
          .update(topFriendsTable)
          .set({ order: newOrder })
          .where(eq(topFriendsTable.id, remaining[i].id));
        remaining[i].order = newOrder;
      }
    }

    return remaining;
  }

  /**
   * Reorder top friends
   * @param userId - The user's UUID
   * @param friendId - The friend's UUID to move
   * @param newOrder - The new 1-indexed position
   * @returns Updated top friends list
   */
  async reorderTopFriend(
    userId: string,
    friendId: string,
    newOrder: number
  ): Promise<TopFriendWithProfile[]> {
    const current = await this.getCurrentTopFriends(userId);
    const friendIndex = current.findIndex((tf) => tf.friendId === friendId);

    if (friendIndex === -1) {
      throw new Error('Friend is not in top friends');
    }

    if (newOrder < 1 || newOrder > current.length) {
      throw new Error('Invalid order position');
    }

    // Save the friend before removing
    const friend = current[friendIndex]!;

    // Remove friend from current position
    current.splice(friendIndex, 1);

    // Insert at new position
    current.splice(newOrder - 1, 0, friend);

    // Update all orders
    for (let i = 0; i < current.length; i++) {
      const topFriendId = current[i].id;
      const order = i + 1;
      await db
        .update(topFriendsTable)
        .set({ order })
        .where(eq(topFriendsTable.id, topFriendId));
    }

    return this.getCurrentTopFriends(userId);
  }
}

// Export a singleton instance for convenience
export const topFriendsService = new TopFriendsService();
