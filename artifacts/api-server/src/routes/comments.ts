import { Router, type Request, type Response } from 'express';
import { commentService } from '../services/commentService';
import { requireAuth, optionalAuth } from '../middlewares/auth';
import {
  CommentCreateRequestSchema,
  CommentResponseSchema,
  CommentListResponseSchema,
} from '@workspace/api-zod';

const router = Router();

/**
 * GET /posts/:postId/comments
 *
 * Given a post ID, when comments are requested, then comments are returned
 * in chronological order with pagination. Author information is included.
 */
router.get('/posts/:postId/comments', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const postIdStr = Array.isArray(postId) ? postId[0] : postId;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    const result = await commentService.listComments({
      postId: postIdStr,
      limit,
      offset,
    });

    const response = CommentListResponseSchema.parse(result);
    res.json(response);
  } catch (error) {
    console.error('Error listing comments:', error);
    res.status(500).json({ message: 'Failed to list comments' });
  }
});

/**
 * POST /posts/:postId/comments
 *
 * Given an authenticated user and a post, when they create a comment,
 * then the comment is persisted and returned with author information.
 */
router.post('/posts/:postId/comments', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { postId } = req.params;
    const postIdStr = Array.isArray(postId) ? postId[0] : postId;
    const input = CommentCreateRequestSchema.parse(req.body);

    const comment = await commentService.createComment({
      postId: postIdStr,
      authorId: userId,
      text: input.text,
    });

    const response = CommentResponseSchema.parse(comment);
    res.status(201).json(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'Post not found') {
      res.status(404).json({ message: 'Post not found' });
    } else if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({ message: 'Invalid request' });
    } else {
      console.error('Error creating comment:', error);
      res.status(500).json({ message: 'Failed to create comment' });
    }
  }
});

export default router;
