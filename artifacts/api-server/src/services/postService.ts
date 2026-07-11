import { PostRepository, type PostWithAuthor } from '@workspace/db';
import { inferTopics } from '@workspace/api-zod';
import type { TextPostContent, VideoPostContent, ReelPostContent } from '@workspace/api-zod';
import { audienceService } from './audienceService';
import { FriendshipRepository } from '@workspace/db';

export interface CreateTextPostInput {
  authorId: string;
  content: TextPostContent;
  audience?: 'everyone' | 'friends' | 'custom';
  audienceListId?: string;
}

export interface CreateVideoPostInput {
  authorId: string;
  content: VideoPostContent;
  audience?: 'everyone' | 'friends' | 'custom';
  audienceListId?: string;
}

export interface CreateReelPostInput {
  authorId: string;
  content: ReelPostContent;
  audience?: 'everyone' | 'friends' | 'custom';
  audienceListId?: string;
}

export interface CreateRepostInput {
  authorId: string;
  originalPostId: string;
}

export interface DeletePostInput {
  userId: string;
  postId: string;
}

/**
 * PostService encapsulates post business logic.
 *
 * Deep module: Hides topic inference, repost chain resolution, duplicate
 * repost guards, and audience filtering behind a simple interface of domain operations.
 */
export class PostService {
  private postRepo: PostRepository;
  private friendshipRepo: FriendshipRepository;

  constructor() {
    this.postRepo = new PostRepository();
    this.friendshipRepo = new FriendshipRepository();
  }

  /**
   * Create a text post with automatic topic inference
   */
  async createTextPost(input: CreateTextPostInput): Promise<PostWithAuthor> {
    const topics = inferTopics(input.content.text);

    return this.postRepo.create({
      authorId: input.authorId,
      kind: 'text',
      content: input.content,
      topics,
      audience: input.audience || 'everyone',
      audienceListId: input.audienceListId,
    });
  }

  /**
   * Create a video post
   */
  async createVideoPost(input: CreateVideoPostInput): Promise<PostWithAuthor> {
    return this.postRepo.create({
      authorId: input.authorId,
      kind: 'video',
      content: input.content,
      topics: [], // Video posts don't auto-infer topics
      audience: input.audience || 'everyone',
      audienceListId: input.audienceListId,
    });
  }

  /**
   * Create a reel post
   */
  async createReelPost(input: CreateReelPostInput): Promise<PostWithAuthor> {
    return this.postRepo.create({
      authorId: input.authorId,
      kind: 'reel',
      content: input.content,
      topics: [], // Reel posts don't auto-infer topics
      audience: input.audience || 'everyone',
      audienceListId: input.audienceListId,
    });
  }

  /**
   * Create a repost of an existing post
   * Resolves the ultimate original post in the repost chain
   * Rejects duplicate reposts by the same user
   */
  async createRepost(input: CreateRepostInput): Promise<PostWithAuthor> {
    // Resolve the ultimate original post
    const originalPost = await this.postRepo.resolveOriginal(input.originalPostId);

    if (!originalPost) {
      throw new Error('Original post not found');
    }

    // Check if user has already reposted this original post
    const hasReposted = await this.postRepo.hasReposted(input.authorId, originalPost.id);

    if (hasReposted) {
      throw new Error('Already reposted this post');
    }

    // Create repost with reference to ultimate original
    // Reposts use 'reel' kind (indicated by repostOf field, not kind)
    // Content is placeholder since reposts don't have their own content
    return this.postRepo.create({
      authorId: input.authorId,
      kind: 'reel',
      content: { kind: 'text', text: '' }, // Placeholder content
      topics: [],
      repostOf: {
        originalPostId: originalPost.id,
        originalAuthorId: originalPost.authorId,
      },
    });
  }

  /**
   * Delete a post (soft delete)
   * Only the post author can delete their own posts
   */
  async deletePost(input: DeletePostInput): Promise<PostWithAuthor> {
    const post = await this.postRepo.getById(input.postId);

    if (!post) {
      throw new Error('Post not found');
    }

    if (post.authorId !== input.userId) {
      throw new Error('Not authorized to delete this post');
    }

    const deletedPost = await this.postRepo.softDelete(input.postId);

    if (!deletedPost) {
      throw new Error('Failed to delete post');
    }

    return deletedPost;
  }

  /**
   * Get a post by ID
   */
  async getPost(postId: string): Promise<PostWithAuthor | null> {
    return this.postRepo.getById(postId);
  }

  /**
   * List posts by author
   */
  async listPostsByAuthor(
    authorId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<PostWithAuthor[]> {
    return this.postRepo.listByAuthor(authorId, limit, offset);
  }

  /**
   * List all posts with audience filtering
   */
  async listPosts(
    viewerId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<PostWithAuthor[]> {
    const allPosts = await this.postRepo.list(limit, offset);

    // Filter posts by audience visibility
    const visiblePosts = await Promise.all(
      allPosts.map(async (post) => {
        if (await this.canViewPost(viewerId, post)) {
          return post;
        }
        return null;
      })
    );

    return visiblePosts.filter((p): p is PostWithAuthor => p !== null);
  }

  /**
   * Check if a viewer can see a post based on audience rules
   */
  private async canViewPost(viewerId: string, post: PostWithAuthor): Promise<boolean> {
    // Viewer can always see their own posts
    if (post.authorId === viewerId) {
      return true;
    }

    switch (post.audience) {
      case 'everyone':
        return true;

      case 'friends':
        return await this.friendshipRepo.areFriends(viewerId, post.authorId);

      case 'custom':
        // Check if viewer is in the audience list
        if (!post.audienceListId) {
          return false;
        }
        return await audienceService.isMember(post.audienceListId, viewerId);

      default:
        return false;
    }
  }
}

// Export a singleton instance for convenience
export const postService = new PostService();
