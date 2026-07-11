import { CommentRepository, type CommentWithAuthor } from '@workspace/db';
import { PostRepository } from '@workspace/db';
import { notificationService } from './notificationService';

export interface CreateCommentInput {
  postId: string;
  authorId: string;
  text: string;
}

export interface ListCommentsInput {
  postId: string;
  limit?: number;
  offset?: number;
}

/**
 * CommentService encapsulates comment business logic.
 *
 * Deep module: Hides comment creation, pagination, and count synchronization
 * behind a simple interface of domain operations.
 */
export class CommentService {
  private commentRepo: CommentRepository;
  private postRepo: PostRepository;

  constructor() {
    this.commentRepo = new CommentRepository();
    this.postRepo = new PostRepository();
  }

  /**
   * Create a comment on a post
   * Validates that the post exists before creating the comment
   */
  async createComment(input: CreateCommentInput): Promise<CommentWithAuthor> {
    // Verify the post exists
    const post = await this.postRepo.getById(input.postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Create the comment
    const comment = await this.commentRepo.create({
      postId: input.postId,
      authorId: input.authorId,
      text: input.text,
    });

    // Create notification if commenter is not the post author
    if (input.authorId !== post.authorId) {
      await notificationService.create({
        recipientId: post.authorId,
        actorId: input.authorId,
        type: 'comment',
        postId: input.postId,
      });
    }

    return comment;
  }

  /**
   * List comments for a post with pagination
   */
  async listComments(input: ListCommentsInput): Promise<{
    comments: CommentWithAuthor[];
    total: number;
  }> {
    const comments = await this.commentRepo.listForPost(
      input.postId,
      input.limit || 20,
      input.offset || 0
    );

    const total = await this.commentRepo.countForPost(input.postId);

    return { comments, total };
  }

  /**
   * Get a single comment by ID
   */
  async getComment(commentId: string): Promise<CommentWithAuthor | null> {
    return this.commentRepo.getWithAuthor(commentId);
  }

  /**
   * Delete a comment
   * Only the comment author can delete their own comments
   */
  async deleteComment(commentId: string, userId: string): Promise<CommentWithAuthor> {
    const comment = await this.commentRepo.getWithAuthor(commentId);

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new Error('Not authorized to delete this comment');
    }

    const deleted = await this.commentRepo.delete(commentId);

    if (!deleted) {
      throw new Error('Failed to delete comment');
    }

    return deleted;
  }
}

// Export a singleton instance for convenience
export const commentService = new CommentService();
