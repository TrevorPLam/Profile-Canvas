import { Router, type Request, type Response } from 'express';
import { engagementService } from '../services/engagementService';
import { requireAuth } from '../middlewares/auth';

const router = Router();

/**
 * POST /posts/:postId/like
 *
 * Given an authenticated user and a post, when they like the post,
 * then the like is recorded and the post's like count increments.
 * Duplicate like requests are idempotent and return success without incrementing the count again.
 */
router.post('/:postId/like', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const postId = Array.isArray(req.params.postId) ? req.params.postId[0] : req.params.postId;

    const summary = await engagementService.toggleLike({ userId, postId });
    res.status(200).json(summary);
  } catch (error) {
    if (error instanceof Error && error.message === 'Post not found') {
      res.status(404).json({ message: 'Post not found' });
      return;
    }
    console.error('Error liking post:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * DELETE /posts/:postId/like
 *
 * Given an authenticated user and a post they have liked, when they unlike the post,
 * then the like is removed and the post's like count decrements.
 * Unlike requests when the user has not liked the post are idempotent and return success without decrementing the count.
 */
router.delete('/:postId/like', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const postId = Array.isArray(req.params.postId) ? req.params.postId[0] : req.params.postId;

    const summary = await engagementService.unlike({ userId, postId });
    res.status(200).json(summary);
  } catch (error) {
    if (error instanceof Error && error.message === 'Post not found') {
      res.status(404).json({ message: 'Post not found' });
      return;
    }
    console.error('Error unliking post:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /posts/:postId/save
 *
 * Given an authenticated user and a post, when they save the post,
 * then the save is recorded and the post's save count increments.
 * Duplicate save requests are idempotent and return success without incrementing the count again.
 */
router.post('/:postId/save', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const postId = Array.isArray(req.params.postId) ? req.params.postId[0] : req.params.postId;

    const summary = await engagementService.toggleSave({ userId, postId });
    res.status(200).json(summary);
  } catch (error) {
    if (error instanceof Error && error.message === 'Post not found') {
      res.status(404).json({ message: 'Post not found' });
      return;
    }
    console.error('Error saving post:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * DELETE /posts/:postId/save
 *
 * Given an authenticated user and a post they have saved, when they unsave the post,
 * then the save is removed and the post's save count decrements.
 * Unsave requests when the user has not saved the post are idempotent and return success without decrementing the count.
 */
router.delete('/:postId/save', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const postId = Array.isArray(req.params.postId) ? req.params.postId[0] : req.params.postId;

    const summary = await engagementService.unsave({ userId, postId });
    res.status(200).json(summary);
  } catch (error) {
    if (error instanceof Error && error.message === 'Post not found') {
      res.status(404).json({ message: 'Post not found' });
      return;
    }
    console.error('Error unsaving post:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
