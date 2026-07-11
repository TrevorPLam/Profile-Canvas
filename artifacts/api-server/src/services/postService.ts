import { PostRepository, type PostWithAuthor } from '@workspace/db';
import { inferTopics } from '@workspace/api-zod';
import type { TextPostContent, VideoPostContent, ReelPostContent } from '@workspace/api-zod';

export interface CreateTextPostInput {
  authorId: string;
  content: TextPostContent;
}

export interface CreateVideoPostInput {
  authorId: string;
  content: VideoPostContent;
}

export interface CreateReelPostInput {
  authorId: string;
  content: ReelPostContent;
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
 * Deep module: Hides topic inference, repost chain resolution, and duplicate
 * repost guards behind a simple interface of domain operations.
 */
export class PostService {
  private postRepo: PostRepository;

  constructor() {
    this.postRepo = new PostRepository();
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
   * List all posts
   */
  async listPosts(limit: number = 20, offset: number = 0): Promise<PostWithAuthor[]> {
    return this.postRepo.list(limit, offset);
  }
}

// Export a singleton instance for convenience
export const postService = new PostService();
