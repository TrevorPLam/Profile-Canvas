import { Router, Request, Response } from 'express';
import { requireAuth } from '../middlewares/auth';
import { collabService } from '../services/collabService';
import type { TextPostContent, VideoPostContent, ReelPostContent } from '@workspace/api-zod';

const router = Router();

/**
 * POST /posts/:postId/remix
 * Remix a post
 */
router.post('/posts/:postId/remix', requireAuth, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.userId!;

    const { content, caption } = req.body;

    if (!content) {
      res.status(400).json({ message: 'Content is required' });
      return;
    }

    const remix = await collabService.createRemix({
      authorId: userId,
      originalPostId: postId,
      content: content as TextPostContent | VideoPostContent | ReelPostContent,
      caption: caption ? String(caption) : undefined,
    });

    res.status(201).json(remix);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Original post not found') {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(400).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /posts/:postId/duet
 * Duet a post
 */
router.post('/posts/:postId/duet', requireAuth, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.userId!;

    const { content, layout, caption } = req.body;

    if (!content) {
      res.status(400).json({ message: 'Content is required' });
      return;
    }

    const duet = await collabService.createDuet({
      authorId: userId,
      originalPostId: postId,
      content: content as VideoPostContent | ReelPostContent,
      layout: layout ? (layout as 'side-by-side' | 'vertical' | 'horizontal') : undefined,
      caption: caption ? String(caption) : undefined,
    });

    res.status(201).json(duet);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Original post not found') {
        res.status(404).json({ message: error.message });
        return;
      }
      if (error.message === 'Can only duet video or reel posts') {
        res.status(400).json({ message: error.message });
        return;
      }
      res.status(400).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /collabs
 * Request a collaboration
 */
router.post('/collabs', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const { targetUserId, kind, content, message } = req.body;

    if (!targetUserId || !kind || !content) {
      res.status(400).json({ message: 'targetUserId, kind, and content are required' });
      return;
    }

    const collab = await collabService.createCollab({
      requesterId: userId,
      targetUserId: String(targetUserId),
      kind: kind as 'text' | 'video' | 'reel',
      content: content as TextPostContent | VideoPostContent | ReelPostContent,
      message: message ? String(message) : undefined,
    });

    res.status(201).json(collab);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Can only collaborate with friends') {
        res.status(403).json({ message: error.message });
        return;
      }
      if (error.message === 'Collab request already exists') {
        res.status(409).json({ message: error.message });
        return;
      }
      res.status(400).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /collabs/:collabId
 * Get a collaboration
 */
router.get('/collabs/:collabId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { collabId } = req.params;

    const collab = await collabService.getCollab(collabId);

    if (!collab) {
      res.status(404).json({ message: 'Collab not found' });
      return;
    }

    res.status(200).json(collab);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * PATCH /collabs/:collabId
 * Update a collaboration
 */
router.patch('/collabs/:collabId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { collabId } = req.params;
    const userId = req.userId!;

    const { status, content } = req.body;

    const statusValue = status ? (status as 'pending' | 'accepted' | 'rejected' | 'cancelled') : undefined;

    if (!status && !content) {
      res.status(400).json({ message: 'status or content is required' });
      return;
    }

    const collab = await collabService.updateCollab({
      userId,
      collabId,
      status: statusValue,
      content: content as TextPostContent | VideoPostContent | ReelPostContent | undefined,
    });

    res.status(200).json(collab);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Collab not found') {
        res.status(404).json({ message: error.message });
        return;
      }
      if (error.message === 'Not a collab post') {
        res.status(400).json({ message: error.message });
        return;
      }
      if (error.message === 'Not authorized to update this collab') {
        res.status(403).json({ message: error.message });
        return;
      }
      if (error.message === 'Only target user can accept collab') {
        res.status(403).json({ message: error.message });
        return;
      }
      if (error.message === 'Only target user can reject collab') {
        res.status(403).json({ message: error.message });
        return;
      }
      if (error.message === 'Only requester can cancel collab') {
        res.status(403).json({ message: error.message });
        return;
      }
      res.status(400).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * DELETE /collabs/:collabId
 * Delete a collaboration
 */
router.delete('/collabs/:collabId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { collabId } = req.params;
    const userId = req.userId!;

    const collab = await collabService.deleteCollab({
      userId,
      collabId,
    });

    res.status(200).json(collab);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Collab not found') {
        res.status(404).json({ message: error.message });
        return;
      }
      if (error.message === 'Not a collab post') {
        res.status(400).json({ message: error.message });
        return;
      }
      if (error.message === 'Not authorized to delete this collab') {
        res.status(403).json({ message: error.message });
        return;
      }
      if (error.message === 'Can only delete pending collabs') {
        res.status(400).json({ message: error.message });
        return;
      }
      res.status(400).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /collabs
 * List collaborations
 */
router.get('/collabs', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { type, status, limit, offset } = req.query;

    const typeValue = type ? (type as 'incoming' | 'outgoing' | 'all') : undefined;
    const statusValue = status ? (status as 'pending' | 'accepted' | 'rejected' | 'cancelled') : undefined;
    const limitValue = limit ? parseInt(String(limit)) : undefined;
    const offsetValue = offset ? parseInt(String(offset)) : undefined;

    const collabs = await collabService.listCollabs({
      userId,
      type: typeValue,
      status: statusValue,
      limit: limitValue,
      offset: offsetValue,
    });

    res.status(200).json({
      collabs,
      total: collabs.length,
    });
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
