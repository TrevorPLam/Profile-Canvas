import { EngagementRepository, type EngagementSummary } from '@workspace/db';
import { PostRepository } from '@workspace/db';

export interface ToggleLikeInput {
  userId: string;
  postId: string;
}

export interface ToggleSaveInput {
  userId: string;
  postId: string;
}

export interface GetEngagementSummaryInput {
  postId: string;
  viewerId?: string;
}

/**
 * EngagementService encapsulates engagement business logic.
 * 
 * Deep module: Hides idempotency logic, count synchronization, and post validation
 * behind a simple interface of domain operations.
 */
export class EngagementService {
  private engagementRepo: EngagementRepository;
  private postRepo: PostRepository;

  constructor() {
    this.engagementRepo = new EngagementRepository();
    this.postRepo = new PostRepository();
  }

  /**
   * Toggle like on a post (idempotent)
   * If the user has already liked, returns success without incrementing
   * If the user hasn't liked, creates the like
   * @param input - User and post IDs
   * @returns Engagement summary with updated counts
   */
  async toggleLike(input: ToggleLikeInput): Promise<EngagementSummary> {
    // Validate post exists
    const post = await this.postRepo.getById(input.postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Try to create like (idempotent via unique constraint)
    await this.engagementRepo.createLike(input.userId, input.postId);

    // Return updated engagement summary
    return this.engagementRepo.getEngagementSummary(input.postId, input.userId);
  }

  /**
   * Unlike a post (idempotent)
   * If the user hasn't liked, returns success without decrementing
   * If the user has liked, removes the like
   * @param input - User and post IDs
   * @returns Engagement summary with updated counts
   */
  async unlike(input: ToggleLikeInput): Promise<EngagementSummary> {
    // Validate post exists
    const post = await this.postRepo.getById(input.postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Try to delete like (idempotent - handles non-existent)
    await this.engagementRepo.deleteLike(input.userId, input.postId);

    // Return updated engagement summary
    return this.engagementRepo.getEngagementSummary(input.postId, input.userId);
  }

  /**
   * Toggle save on a post (idempotent)
   * If the user has already saved, returns success without incrementing
   * If the user hasn't saved, creates the save
   * @param input - User and post IDs
   * @returns Engagement summary with updated counts
   */
  async toggleSave(input: ToggleSaveInput): Promise<EngagementSummary> {
    // Validate post exists
    const post = await this.postRepo.getById(input.postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Try to create save (idempotent via unique constraint)
    await this.engagementRepo.createSave(input.userId, input.postId);

    // Return updated engagement summary
    return this.engagementRepo.getEngagementSummary(input.postId, input.userId);
  }

  /**
   * Unsave a post (idempotent)
   * If the user hasn't saved, returns success without decrementing
   * If the user has saved, removes the save
   * @param input - User and post IDs
   * @returns Engagement summary with updated counts
   */
  async unsave(input: ToggleSaveInput): Promise<EngagementSummary> {
    // Validate post exists
    const post = await this.postRepo.getById(input.postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Try to delete save (idempotent - handles non-existent)
    await this.engagementRepo.deleteSave(input.userId, input.postId);

    // Return updated engagement summary
    return this.engagementRepo.getEngagementSummary(input.postId, input.userId);
  }

  /**
   * Get engagement summary for a post
   * @param input - Post ID and optional viewer ID
   * @returns Engagement summary with counts and viewer state
   */
  async getEngagementSummary(input: GetEngagementSummaryInput): Promise<EngagementSummary> {
    // Validate post exists
    const post = await this.postRepo.getById(input.postId);
    if (!post) {
      throw new Error('Post not found');
    }

    return this.engagementRepo.getEngagementSummary(input.postId, input.viewerId);
  }
}

// Export a singleton instance for convenience
export const engagementService = new EngagementService();
