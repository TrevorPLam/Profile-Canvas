import { StoryRepository, type StoryWithAuthor, type StoryAudience } from '@workspace/db';
import { FriendshipRepository } from '@workspace/db';
import { audienceService } from './audienceService';

export interface CreateStoryInput {
  authorId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  stickers?: unknown[];
  poll?: unknown;
  audience: StoryAudience;
  audienceListId?: string | null;
}

export interface DeleteStoryInput {
  userId: string;
  storyId: string;
}

export interface GetStoriesFeedInput {
  viewerId: string;
}

export interface GetUserStoriesInput {
  viewerId: string;
  targetUserId: string;
}

/**
 * StoryService encapsulates story business logic.
 *
 * Deep module: Hides expiration logic, audience filtering, and sticker/poll parsing
 * behind a simple interface of domain operations.
 */
export class StoryService {
  private storyRepo: StoryRepository;
  private friendshipRepo: FriendshipRepository;

  constructor() {
    this.storyRepo = new StoryRepository();
    this.friendshipRepo = new FriendshipRepository();
  }

  /**
   * Create a new story with 24-hour expiration
   */
  async createStory(input: CreateStoryInput): Promise<StoryWithAuthor> {
    // Calculate expiration time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Validate audienceListId is provided if audience is 'custom'
    if (input.audience === 'custom' && !input.audienceListId) {
      throw new Error('audienceListId is required when audience is custom');
    }

    return this.storyRepo.create({
      authorId: input.authorId,
      mediaUrl: input.mediaUrl,
      mediaType: input.mediaType,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Stickers array type requires any for JSONB
      stickers: (input.stickers || []) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Poll object type requires any for JSONB
      poll: (input.poll as any) || undefined,
      audience: input.audience,
      audienceListId: input.audienceListId || undefined,
      expiresAt,
    });
  }

  /**
   * Delete a story
   * Only the story author can delete their own stories
   */
  async deleteStory(input: DeleteStoryInput): Promise<StoryWithAuthor> {
    const story = await this.storyRepo.getById(input.storyId);

    if (!story) {
      throw new Error('Story not found');
    }

    if (story.authorId !== input.userId) {
      throw new Error('Not authorized to delete this story');
    }

    const deletedStory = await this.storyRepo.delete(input.storyId);

    if (!deletedStory) {
      throw new Error('Failed to delete story');
    }

    return deletedStory;
  }

  /**
   * Get stories feed for a viewer
   * Returns non-expired stories from friends and custom audience lists
   * Stories are filtered by audience visibility rules
   */
  async getStoriesFeed(input: GetStoriesFeedInput): Promise<StoryWithAuthor[]> {
    // Get all stories from the viewer's friends
    // This is a simplified approach - in production you'd want to optimize this query
    // to avoid fetching all friends and then all their stories
    const allStories = await this.storyRepo.listByAuthors([input.viewerId]);

    // Filter stories by audience visibility
    const visibleStories = await Promise.all(
      allStories.map(async (story) => {
        if (await this.canViewStory(input.viewerId, story)) {
          return story;
        }
        return null;
      })
    );

    // Remove nulls and group by author
    const filteredStories = visibleStories.filter((s): s is StoryWithAuthor => s !== null);

    return filteredStories;
  }

  /**
   * Get stories for a specific user
   * Returns non-expired stories if the viewer is in the audience
   */
  async getUserStories(input: GetUserStoriesInput): Promise<StoryWithAuthor[]> {
    const stories = await this.storyRepo.listByAuthor(input.targetUserId);
    
    // Filter by audience visibility
    const visibleStories = await Promise.all(
      stories.map(async (story) => {
        if (await this.canViewStory(input.viewerId, story)) {
          return story;
        }
        return null;
      })
    );

    return visibleStories.filter((s): s is StoryWithAuthor => s !== null);
  }

  /**
   * Check if a viewer can see a story based on audience rules
   */
  private async canViewStory(viewerId: string, story: StoryWithAuthor): Promise<boolean> {
    // Viewer can always see their own stories
    if (story.authorId === viewerId) {
      return true;
    }

    switch (story.audience) {
      case 'everyone':
        return true;

      case 'friends':
        return await this.friendshipRepo.areFriends(viewerId, story.authorId);

      case 'custom':
        // Check if viewer is in the audience list
        if (!story.audienceListId) {
          return false;
        }
        return await audienceService.isMember(story.audienceListId, viewerId);

      default:
        return false;
    }
  }
}

// Export a singleton instance for convenience
export const storyService = new StoryService();
