import { Router, Request, Response } from 'express';
import { feedService } from '../services/feedService';
import { requireAuth } from '../middlewares/auth';

const router = Router();

/**
 * GET /feed
 * Get main feed: posts from friends and self in chronological order
 */
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    // Validate pagination parameters
    if (limit < 1 || limit > 100) {
      res.status(400).json({ error: 'Limit must be between 1 and 100' });
      return;
    }
    if (offset < 0) {
      res.status(400).json({ error: 'Offset must be non-negative' });
      return;
    }

    const feed = await feedService.getFeed({ userId, limit, offset });
    res.json(feed);
  } catch (error) {
    console.error('Error getting feed:', error);
    res.status(500).json({ error: 'Failed to get feed' });
  }
});

/**
 * GET /feed/recommended
 * Get recommended feed: posts from non-friends ranked by engagement
 */
router.get('/recommended', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    // Validate pagination parameters
    if (limit < 1 || limit > 100) {
      res.status(400).json({ error: 'Limit must be between 1 and 100' });
      return;
    }
    if (offset < 0) {
      res.status(400).json({ error: 'Offset must be non-negative' });
      return;
    }

    const feed = await feedService.getRecommended({ userId, limit, offset });
    res.json(feed);
  } catch (error) {
    console.error('Error getting recommended feed:', error);
    res.status(500).json({ error: 'Failed to get recommended feed' });
  }
});

export default router;
