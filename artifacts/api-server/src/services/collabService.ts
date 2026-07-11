import { PostRepository, type PostWithAuthor, FriendshipRepository } from '@workspace/db';
import type { TextPostContent, VideoPostContent, ReelPostContent } from '@workspace/api-zod';

export type CollabStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface CreateRemixInput {
  authorId: string;
  originalPostId: string;
  content: TextPostContent | VideoPostContent | ReelPostContent;
  caption?: string;
}

export interface CreateDuetInput {
  authorId: string;
  originalPostId: string;
  content: VideoPostContent | ReelPostContent;
  layout?: 'side-by-side' | 'vertical' | 'horizontal';
  caption?: string;
}

export interface CreateCollabInput {
  requesterId: string;
  targetUserId: string;
  kind: 'text' | 'video' | 'reel';
  content: TextPostContent | VideoPostContent | ReelPostContent;
  message?: string;
}

export interface UpdateCollabInput {
  userId: string;
  collabId: string;
  status?: CollabStatus;
  content?: TextPostContent | VideoPostContent | ReelPostContent;
}

export interface DeleteCollabInput {
  userId: string;
  collabId: string;
}

export interface ListCollabsInput {
  userId: string;
  type?: 'incoming' | 'outgoing' | 'all';
  status?: CollabStatus;
  limit?: number;
  offset?: number;
}

/**
 * CollabService encapsulates collaboration business logic.
 *
 * Deep module: Hides remix/duet creation, collab approval workflow, and
 * multi-author post management behind a simple interface of domain operations.
 */
export class CollabService {
  private postRepo: PostRepository;
  private friendshipRepo: FriendshipRepository;

  constructor() {
    this.postRepo = new PostRepository();
    this.friendshipRepo = new FriendshipRepository();
  }

  /**
   * Create a remix of an existing post
   * Remixes credit the original author and are visible in the original post's remixes list
   */
  async createRemix(input: CreateRemixInput): Promise<PostWithAuthor> {
    const originalPost = await this.postRepo.getById(input.originalPostId);

    if (!originalPost) {
      throw new Error('Original post not found');
    }

    // Create remix with reference to original
    return this.postRepo.create({
      authorId: input.authorId,
      kind: originalPost.kind,
      content: input.content,
      topics: [], // Remixes don't auto-infer topics
      remixOf: {
        originalPostId: originalPost.id,
        originalAuthorId: originalPost.authorId,
      },
    });
  }

  /**
   * Create a duet of an existing video or reel post
   * Duets create a side-by-side video response with a reference to the original
   */
  async createDuet(input: CreateDuetInput): Promise<PostWithAuthor> {
    const originalPost = await this.postRepo.getById(input.originalPostId);

    if (!originalPost) {
      throw new Error('Original post not found');
    }

    if (originalPost.kind !== 'video' && originalPost.kind !== 'reel') {
      throw new Error('Can only duet video or reel posts');
    }

    // Create duet with reference to original
    return this.postRepo.create({
      authorId: input.authorId,
      kind: originalPost.kind,
      content: input.content,
      topics: [],
      duetOf: {
        originalPostId: originalPost.id,
        originalAuthorId: originalPost.authorId,
        layout: input.layout || 'side-by-side',
      },
    });
  }

  /**
   * Create a collab request
   * The target user must explicitly accept before the collab post is created
   */
  async createCollab(input: CreateCollabInput): Promise<PostWithAuthor> {
    // Check if users are friends
    const areFriends = await this.friendshipRepo.areFriends(
      input.requesterId,
      input.targetUserId
    );

    if (!areFriends) {
      throw new Error('Can only collaborate with friends');
    }

    // Check if a pending collab already exists between these users
    // This is a simplified check - in production you'd want a dedicated collabs table
    const existingCollab = await this.findPendingCollab(
      input.requesterId,
      input.targetUserId
    );

    if (existingCollab) {
      throw new Error('Collab request already exists');
    }

    // Create a pending collab post
    return this.postRepo.create({
      authorId: input.requesterId,
      kind: input.kind,
      content: input.content,
      topics: [],
      collabRequestStatus: 'pending',
      secondAuthorId: input.targetUserId,
    });
  }

  /**
   * Update a collab (accept, reject, cancel, or update content)
   * Only the target user can accept/reject, requester can cancel
   */
  async updateCollab(input: UpdateCollabInput): Promise<PostWithAuthor> {
    const collab = await this.postRepo.getById(input.collabId);

    if (!collab) {
      throw new Error('Collab not found');
    }

    if (!collab.collabRequestStatus) {
      throw new Error('Not a collab post');
    }

    // Check authorization
    const isRequester = input.userId === collab.authorId;
    const isTarget = input.userId === collab.secondAuthorId;

    if (!isRequester && !isTarget) {
      throw new Error('Not authorized to update this collab');
    }

    // Validate status transitions
    if (input.status) {
      if (input.status === 'accepted' && !isTarget) {
        throw new Error('Only target user can accept collab');
      }
      if (input.status === 'rejected' && !isTarget) {
        throw new Error('Only target user can reject collab');
      }
      if (input.status === 'cancelled' && !isRequester) {
        throw new Error('Only requester can cancel collab');
      }
    }

    // Update the collab
    const updates: { collabRequestStatus?: CollabStatus; content?: TextPostContent | VideoPostContent | ReelPostContent } = {};
    if (input.status) {
      updates.collabRequestStatus = input.status;
    }
    if (input.content) {
      updates.content = input.content;
    }

    const updated = await this.postRepo.update(input.collabId, updates);
    if (!updated) {
      throw new Error('Failed to update collab');
    }
    return updated;
  }

  /**
   * Delete a pending collab request
   * Only the requester can delete pending collabs
   */
  async deleteCollab(input: DeleteCollabInput): Promise<PostWithAuthor> {
    const collab = await this.postRepo.getById(input.collabId);

    if (!collab) {
      throw new Error('Collab not found');
    }

    if (!collab.collabRequestStatus) {
      throw new Error('Not a collab post');
    }

    if (collab.authorId !== input.userId) {
      throw new Error('Not authorized to delete this collab');
    }

    if (collab.collabRequestStatus !== 'pending') {
      throw new Error('Can only delete pending collabs');
    }

    const deleted = await this.postRepo.softDelete(input.collabId);
    if (!deleted) {
      throw new Error('Failed to delete collab');
    }
    return deleted;
  }

  /**
   * List collabs for a user with filtering
   */
  async listCollabs(input: ListCollabsInput): Promise<PostWithAuthor[]> {
    const allPosts = await this.postRepo.list(input.limit || 20, input.offset || 0);

    // Filter for collab posts
    const collabPosts = allPosts.filter((post) => post.collabRequestStatus !== null);

    // Filter by type (incoming, outgoing, or all)
    const filteredByType = collabPosts.filter((post) => {
      if (input.type === 'incoming') {
        return post.secondAuthorId === input.userId;
      }
      if (input.type === 'outgoing') {
        return post.authorId === input.userId;
      }
      // 'all' or undefined
      return post.authorId === input.userId || post.secondAuthorId === input.userId;
    });

    // Filter by status
    const filteredByStatus = input.status
      ? filteredByType.filter((post) => post.collabRequestStatus === input.status)
      : filteredByType;

    return filteredByStatus;
  }

  /**
   * Get a collab by ID
   */
  async getCollab(collabId: string): Promise<PostWithAuthor | null> {
    return this.postRepo.getById(collabId);
  }

  /**
   * Find a pending collab between two users
   * This is a simplified implementation - in production use a dedicated collabs table
   */
  private async findPendingCollab(
    requesterId: string,
    targetUserId: string
  ): Promise<PostWithAuthor | null> {
    const allPosts = await this.postRepo.list(100, 0);

    return (
      allPosts.find(
        (post) =>
          post.collabRequestStatus === 'pending' &&
          post.authorId === requesterId &&
          post.secondAuthorId === targetUserId
      ) || null
    );
  }
}

// Export a singleton instance for convenience
export const collabService = new CollabService();
