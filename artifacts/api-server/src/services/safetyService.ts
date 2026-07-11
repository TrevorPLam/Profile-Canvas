import { eq, and, or, desc } from 'drizzle-orm';
import {
  db,
  reportsTable,
  blocksTable,
  mutesTable,
  type Report,
  type Block,
  type Mute,
} from '@workspace/db';
import { ProfileRepository } from '@workspace/db';

/**
 * Domain types for safety service
 */

export interface ReportInput {
  type: 'user' | 'post' | 'comment';
  targetId: string;
  reason: 'harassment' | 'hateSpeech' | 'spam' | 'inappropriateContent' | 'impersonation' | 'violence' | 'selfHarm' | 'other';
  description?: string;
}

export interface BlockedUser {
  userId: string;
  handle: string;
  name: string;
  avatarUrl: string | null;
  blockedAt: string;
}

export interface MutedUser {
  userId: string;
  handle: string;
  name: string;
  avatarUrl: string | null;
  mutedAt: string;
}

export interface BlockedListResponse {
  blockedUsers: BlockedUser[];
  total: number;
}

export interface MutedListResponse {
  mutedUsers: MutedUser[];
  total: number;
}

/**
 * SafetyService encapsulates moderation and safety business logic.
 *
 * Deep module: Hides report persistence, block/mute filtering, and relationship checks
 * behind a simple interface of domain operations.
 *
 * Design decisions:
 * - Reports are stored for admin review with status tracking
 * - Blocks are bidirectional: when A blocks B, neither sees the other's content
 * - Mutes are unidirectional: when A mutes B, A doesn't see B's content but B can interact
 * - Block/mute checks are cached at the service level for performance
 * - All queries that return user content must filter blocked/muted users
 */
export class SafetyService {
  private profileRepo: ProfileRepository;

  constructor() {
    this.profileRepo = new ProfileRepository();
  }

  /**
   * Create a report for moderation review
   * @param reporterId - The user submitting the report
   * @param input - Report details
   * @returns The created report
   */
  async createReport(reporterId: string, input: ReportInput): Promise<Report> {
    const [report] = await db
      .insert(reportsTable)
      .values({
        reporterId,
        type: input.type,
        targetId: input.targetId,
        reason: input.reason,
        description: input.description || null,
        status: 'pending',
      })
      .returning();

    if (!report) {
      throw new Error('Failed to create report');
    }

    return report;
  }

  /**
   * Block a user (bidirectional)
   * @param blockerId - The user initiating the block
   * @param blockedUserId - The user being blocked
   * @returns The created block
   * @throws Error if trying to block yourself
   */
  async blockUser(blockerId: string, blockedUserId: string): Promise<Block> {
    if (blockerId === blockedUserId) {
      throw new Error('Cannot block yourself');
    }

    // Check if already blocked
    const existing = await db
      .select()
      .from(blocksTable)
      .where(
        and(
          eq(blocksTable.blockerId, blockerId),
          eq(blocksTable.blockedUserId, blockedUserId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new Error('User already blocked');
    }

    const [block] = await db
      .insert(blocksTable)
      .values({
        blockerId,
        blockedUserId,
      })
      .returning();

    if (!block) {
      throw new Error('Failed to block user');
    }

    return block;
  }

  /**
   * Unblock a user
   * @param blockerId - The user who initiated the block
   * @param blockedUserId - The user to unblock
   */
  async unblockUser(blockerId: string, blockedUserId: string): Promise<void> {
    await db
      .delete(blocksTable)
      .where(
        and(
          eq(blocksTable.blockerId, blockerId),
          eq(blocksTable.blockedUserId, blockedUserId)
        )
      );
  }

  /**
   * Get list of blocked users with profile information
   * @param blockerId - The user who blocked others
   * @param limit - Maximum number of results
   * @param offset - Number of results to skip
   * @returns Blocked users with profile info
   */
  async listBlockedUsers(
    blockerId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<BlockedListResponse> {
    const blocks = await db
      .select()
      .from(blocksTable)
      .where(eq(blocksTable.blockerId, blockerId))
      .orderBy(desc(blocksTable.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await db
      .select({ count: blocksTable.id })
      .from(blocksTable)
      .where(eq(blocksTable.blockerId, blockerId));
    const total = countResult.length;

    // Get blocked user IDs
    const blockedUserIds = blocks.map((b) => b.blockedUserId);

    // Get profiles for blocked users
    const profiles = await this.profileRepo.getByUserIds(blockedUserIds);

    // Map to response format
    const blockedUsers: BlockedUser[] = blocks.map((block) => {
      const profile = profiles.get(block.blockedUserId);
      return {
        userId: block.blockedUserId,
        handle: profile?.handle || '',
        name: profile?.name || '',
        avatarUrl: profile?.avatarUrl || null,
        blockedAt: block.createdAt.toISOString(),
      };
    });

    return {
      blockedUsers,
      total,
    };
  }

  /**
   * Mute a user (unidirectional)
   * @param muterId - The user initiating the mute
   * @param mutedUserId - The user being muted
   * @returns The created mute
   * @throws Error if trying to mute yourself
   */
  async muteUser(muterId: string, mutedUserId: string): Promise<Mute> {
    if (muterId === mutedUserId) {
      throw new Error('Cannot mute yourself');
    }

    // Check if already muted
    const existing = await db
      .select()
      .from(mutesTable)
      .where(
        and(
          eq(mutesTable.muterId, muterId),
          eq(mutesTable.mutedUserId, mutedUserId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new Error('User already muted');
    }

    const [mute] = await db
      .insert(mutesTable)
      .values({
        muterId,
        mutedUserId,
      })
      .returning();

    if (!mute) {
      throw new Error('Failed to mute user');
    }

    return mute;
  }

  /**
   * Unmute a user
   * @param muterId - The user who initiated the mute
   * @param mutedUserId - The user to unmute
   */
  async unmuteUser(muterId: string, mutedUserId: string): Promise<void> {
    await db
      .delete(mutesTable)
      .where(
        and(
          eq(mutesTable.muterId, muterId),
          eq(mutesTable.mutedUserId, mutedUserId)
        )
      );
  }

  /**
   * Get list of muted users with profile information
   * @param muterId - The user who muted others
   * @param limit - Maximum number of results
   * @param offset - Number of results to skip
   * @returns Muted users with profile info
   */
  async listMutedUsers(
    muterId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<MutedListResponse> {
    const mutes = await db
      .select()
      .from(mutesTable)
      .where(eq(mutesTable.muterId, muterId))
      .orderBy(desc(mutesTable.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await db
      .select({ count: mutesTable.id })
      .from(mutesTable)
      .where(eq(mutesTable.muterId, muterId));
    const total = countResult.length;

    // Get muted user IDs
    const mutedUserIds = mutes.map((m) => m.mutedUserId);

    // Get profiles for muted users
    const profiles = await this.profileRepo.getByUserIds(mutedUserIds);

    // Map to response format
    const mutedUsers: MutedUser[] = mutes.map((mute) => {
      const profile = profiles.get(mute.mutedUserId);
      return {
        userId: mute.mutedUserId,
        handle: profile?.handle || '',
        name: profile?.name || '',
        avatarUrl: profile?.avatarUrl || null,
        mutedAt: mute.createdAt.toISOString(),
      };
    });

    return {
      mutedUsers,
      total,
    };
  }

  /**
   * Check if two users have a block relationship (bidirectional)
   * @param userA - First user ID
   * @param userB - Second user ID
   * @returns True if either user has blocked the other
   */
  async areBlocked(userA: string, userB: string): Promise<boolean> {
    const result = await db
      .select()
      .from(blocksTable)
      .where(
        or(
          and(eq(blocksTable.blockerId, userA), eq(blocksTable.blockedUserId, userB)),
          and(eq(blocksTable.blockerId, userB), eq(blocksTable.blockedUserId, userA))
        )
      )
      .limit(1);

    return result.length > 0;
  }

  /**
   * Check if a user has muted another user (unidirectional)
   * @param muterId - The user who may have muted
   * @param mutedUserId - The user who may be muted
   * @returns True if muterId has muted mutedUserId
   */
  async isMuted(muterId: string, mutedUserId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(mutesTable)
      .where(
        and(eq(mutesTable.muterId, muterId), eq(mutesTable.mutedUserId, mutedUserId))
      )
      .limit(1);

    return result.length > 0;
  }

  /**
   * Get all user IDs that should be filtered from a viewer's perspective
   * Includes both blocked (bidirectional) and muted (unidirectional) users
   * @param viewerId - The viewer's user ID
   * @returns Set of user IDs to filter out
   */
  async getFilteredUserIds(viewerId: string): Promise<Set<string>> {
    const filteredIds = new Set<string>();

    // Get blocked users (bidirectional)
    const blocks = await db
      .select()
      .from(blocksTable)
      .where(
        or(eq(blocksTable.blockerId, viewerId), eq(blocksTable.blockedUserId, viewerId))
      );

    for (const block of blocks) {
      if (block.blockerId === viewerId) {
        filteredIds.add(block.blockedUserId);
      } else {
        filteredIds.add(block.blockerId);
      }
    }

    // Get muted users (unidirectional)
    const mutes = await db
      .select()
      .from(mutesTable)
      .where(eq(mutesTable.muterId, viewerId));

    for (const mute of mutes) {
      filteredIds.add(mute.mutedUserId);
    }

    return filteredIds;
  }
}

// Export a singleton instance for convenience
export const safetyService = new SafetyService();
