import { audienceRepository, type AudienceList } from '@workspace/db';

/**
 * Maximum number of audience lists per user
 */
const MAX_LISTS_PER_USER = 10;

/**
 * Maximum number of members per audience list
 */
const MAX_MEMBERS_PER_LIST = 100;

/**
 * Domain types for audience service
 */

export interface CreateAudienceListInput {
  ownerId: string;
  name: string;
  emoji?: string;
  memberIds?: string[];
}

export interface UpdateAudienceListInput {
  listId: string;
  ownerId: string;
  name?: string;
  emoji?: string;
  memberIds?: string[];
}

export interface AddMembersInput {
  listId: string;
  ownerId: string;
  memberIds: string[];
}

export interface RemoveMembersInput {
  listId: string;
  ownerId: string;
  memberIds: string[];
}

export interface AudienceListResponse {
  id: string;
  ownerId: string;
  name: string;
  emoji: string | null;
  memberIds: string[];
  createdAt: string;
}

export interface AudienceListListResponse {
  lists: AudienceListResponse[];
  total: number;
}

/**
 * AudienceService encapsulates audience list business logic.
 *
 * Deep module: Hides list limits, membership validation, and ownership checks
 * behind a simple interface of domain operations.
 *
 * Design decisions:
 * - Enforces per-user list limits (10 lists, 100 members each)
 * - Validates ownership before modifications
 * - Add/remove members silently (no notifications)
 * - Prevents duplicate members
 */
export class AudienceService {
  /**
   * Create a new audience list
   * @param input - The list creation data
   * @returns The created list
   */
  async createList(input: CreateAudienceListInput): Promise<AudienceListResponse> {
    // Validate list count limit
    const currentCount = await audienceRepository.countByOwner(input.ownerId);
    if (currentCount >= MAX_LISTS_PER_USER) {
      throw new Error(`Maximum of ${MAX_LISTS_PER_USER} audience lists allowed per user`);
    }

    // Validate member count limit
    const memberIds = input.memberIds || [];
    if (memberIds.length > MAX_MEMBERS_PER_LIST) {
      throw new Error(`Maximum of ${MAX_MEMBERS_PER_LIST} members allowed per list`);
    }

    // Remove duplicate member IDs
    const uniqueMemberIds = Array.from(new Set(memberIds));

    const list = await audienceRepository.create({
      ownerId: input.ownerId,
      name: input.name,
      emoji: input.emoji || null,
      memberIds: uniqueMemberIds,
    });

    return this.toAudienceListResponse(list);
  }

  /**
   * Get an audience list by ID
   * @param listId - The list's UUID
   * @param ownerId - The user's UUID (for ownership validation)
   * @returns The list or null if not found
   */
  async getList(listId: string, ownerId: string): Promise<AudienceListResponse | null> {
    const list = await audienceRepository.getById(listId);

    if (!list) {
      return null;
    }

    // Validate ownership
    if (list.ownerId !== ownerId) {
      throw new Error('Not authorized to view this list');
    }

    return this.toAudienceListResponse(list);
  }

  /**
   * Get all audience lists for a user
   * @param ownerId - The user's UUID
   * @returns List of audience lists
   */
  async listLists(ownerId: string): Promise<AudienceListListResponse> {
    const lists = await audienceRepository.listByOwner(ownerId);

    return {
      lists: lists.map((list) => this.toAudienceListResponse(list)),
      total: lists.length,
    };
  }

  /**
   * Update an audience list
   * @param input - The update data
   * @returns The updated list or null if not found
   */
  async updateList(input: UpdateAudienceListInput): Promise<AudienceListResponse | null> {
    // Validate ownership
    const isOwner = await audienceRepository.isOwner(input.listId, input.ownerId);
    if (!isOwner) {
      throw new Error('Not authorized to update this list');
    }

    // If updating memberIds, validate count limit
    if (input.memberIds !== undefined) {
      if (input.memberIds.length > MAX_MEMBERS_PER_LIST) {
        throw new Error(`Maximum of ${MAX_MEMBERS_PER_LIST} members allowed per list`);
      }
      // Remove duplicates
      input.memberIds = Array.from(new Set(input.memberIds));
    }

    const updates: { name?: string; emoji?: string | null; memberIds?: string[] } = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.emoji !== undefined) updates.emoji = input.emoji;
    if (input.memberIds !== undefined) updates.memberIds = input.memberIds;

    const list = await audienceRepository.update(input.listId, updates);

    if (!list) {
      return null;
    }

    return this.toAudienceListResponse(list);
  }

  /**
   * Delete an audience list
   * @param listId - The list's UUID
   * @param ownerId - The user's UUID
   * @returns True if deleted, false if not found
   */
  async deleteList(listId: string, ownerId: string): Promise<boolean> {
    // Validate ownership
    const isOwner = await audienceRepository.isOwner(listId, ownerId);
    if (!isOwner) {
      throw new Error('Not authorized to delete this list');
    }

    return audienceRepository.delete(listId);
  }

  /**
   * Add members to an audience list
   * @param input - The add members data
   * @returns The updated list or null if not found
   */
  async addMembers(input: AddMembersInput): Promise<AudienceListResponse | null> {
    // Validate ownership
    const isOwner = await audienceRepository.isOwner(input.listId, input.ownerId);
    if (!isOwner) {
      throw new Error('Not authorized to modify this list');
    }

    const list = await audienceRepository.getById(input.listId);
    if (!list) {
      return null;
    }

    // Validate member count limit
    const newMemberIds = Array.from(new Set([...list.memberIds, ...input.memberIds]));
    if (newMemberIds.length > MAX_MEMBERS_PER_LIST) {
      throw new Error(`Maximum of ${MAX_MEMBERS_PER_LIST} members allowed per list`);
    }

    const updatedList = await audienceRepository.update(input.listId, {
      memberIds: newMemberIds,
    });

    if (!updatedList) {
      return null;
    }

    return this.toAudienceListResponse(updatedList);
  }

  /**
   * Remove members from an audience list
   * @param input - The remove members data
   * @returns The updated list or null if not found
   */
  async removeMembers(input: RemoveMembersInput): Promise<AudienceListResponse | null> {
    // Validate ownership
    const isOwner = await audienceRepository.isOwner(input.listId, input.ownerId);
    if (!isOwner) {
      throw new Error('Not authorized to modify this list');
    }

    const list = await audienceRepository.getById(input.listId);
    if (!list) {
      return null;
    }

    // Remove specified members
    const memberSet = new Set(list.memberIds);
    for (const memberId of input.memberIds) {
      memberSet.delete(memberId);
    }

    const updatedList = await audienceRepository.update(input.listId, {
      memberIds: Array.from(memberSet),
    });

    if (!updatedList) {
      return null;
    }

    return this.toAudienceListResponse(updatedList);
  }

  /**
   * Check if a user is a member of an audience list
   * @param listId - The list's UUID
   * @param userId - The user's UUID to check
   * @returns True if user is in the list, false otherwise
   */
  async isMember(listId: string, userId: string): Promise<boolean> {
    return audienceRepository.isMember(listId, userId);
  }

  /**
   * Get all audience lists that a user is a member of
   * @param userId - The user's UUID
   * @returns Array of audience lists the user belongs to
   */
  async listByMember(userId: string): Promise<AudienceListResponse[]> {
    const lists = await audienceRepository.listByMember(userId);
    return lists.map((list) => this.toAudienceListResponse(list));
  }

  /**
   * Convert a repository audience list to a service response
   */
  private toAudienceListResponse(list: AudienceList): AudienceListResponse {
    return {
      id: list.id,
      ownerId: list.ownerId,
      name: list.name,
      emoji: list.emoji || null,
      memberIds: list.memberIds,
      createdAt: list.createdAt.toISOString(),
    };
  }
}

// Export a singleton instance for convenience
export const audienceService = new AudienceService();
