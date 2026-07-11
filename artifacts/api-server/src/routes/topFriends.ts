import { Router, type Request, type Response } from 'express';
import { topFriendsService } from '../services/topFriendsService';
import { requireAuth } from '../middlewares/auth';

const router = Router();

/**
 * GET /top-friends
 * Get current top friends for the authenticated user
 */
router.get('/', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const userId = req.userId!;
    const topFriends = await topFriendsService.getCurrentTopFriends(userId);
    res.json({ topFriends });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /top-friends/history
 * Get top friends history for the authenticated user
 */
router.get('/history', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const userId = req.userId!;
    const history = await topFriendsService.getHistory(userId);
    res.json(history);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /top-friends
 * Set top friends for the authenticated user
 * Body: { topFriendIds: string[] }
 */
router.put('/', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const userId = req.userId!;
    const { topFriendIds } = req.body;

    if (!Array.isArray(topFriendIds)) {
      res.status(400).json({ error: 'topFriendIds must be an array' });
      return;
    }

    // Validate all IDs are UUIDs
    for (const id of topFriendIds) {
      if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        res.status(400).json({ error: 'Invalid friend ID format' });
        return;
      }
    }

    const topFriends = await topFriendsService.setTopFriends(userId, topFriendIds);
    res.json({ topFriends });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /top-friends/:friendId
 * Remove a friend from top friends
 */
router.delete('/:friendId', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const userId = req.userId!;
    const { friendId } = req.params;

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(friendId)) {
      res.status(400).json({ error: 'Invalid friend ID format' });
      return;
    }

    const topFriends = await topFriendsService.removeTopFriend(userId, friendId);
    res.json({ topFriends });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /top-friends/:friendId/reorder
 * Reorder a top friend to a new position
 * Body: { order: number }
 */
router.patch('/:friendId/reorder', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const userId = req.userId!;
    const { friendId } = req.params;
    const { order } = req.body;

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(friendId)) {
      res.status(400).json({ error: 'Invalid friend ID format' });
      return;
    }

    if (typeof order !== 'number' || order < 1) {
      res.status(400).json({ error: 'Order must be a positive number' });
      return;
    }

    const topFriends = await topFriendsService.reorderTopFriend(userId, friendId, order);
    res.json({ topFriends });
  } catch (error) {
    next(error);
  }
});

export default router;
