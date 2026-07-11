import { Router, Request, Response } from 'express';
import { feedService } from '../services/feedService';
import { peopleDiscoveryService } from '../services/peopleDiscoveryService';
import { requireAuth } from '../middlewares/auth';

const router = Router();

/**
 * GET /discover/trending
 * Get trending feed: posts sorted by recent engagement
 */
router.get('/trending', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
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

    const feed = await feedService.getTrending({ limit, offset });
    res.json(feed);
  } catch (error) {
    console.error('Error getting trending feed:', error);
    res.status(500).json({ error: 'Failed to get trending feed' });
  }
});

/**
 * GET /discover
 * Search posts by text, topic, and author with ranking by likes
 */
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const query = req.query.q as string | undefined;
    const topic = req.query.topic as string | undefined;
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

    const feed = await feedService.search({ userId, query, topic, limit, offset });
    res.json(feed);
  } catch (error) {
    console.error('Error searching posts:', error);
    res.status(500).json({ error: 'Failed to search posts' });
  }
});

/**
 * GET /discover/people
 * Get suggested users (people you may know)
 */
router.get('/people', requireAuth, async (req: Request, res: Response): Promise<void> => {
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

    const suggestions = await peopleDiscoveryService.getSuggestions(userId, limit, offset);
    res.json(suggestions);
  } catch (error) {
    console.error('Error getting people suggestions:', error);
    res.status(500).json({ error: 'Failed to get people suggestions' });
  }
});

/**
 * GET /discover/profiles
 * Search profiles by handle
 */
router.get('/profiles', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string | undefined;
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

    if (!query) {
      res.status(400).json({ error: 'Query parameter "q" is required' });
      return;
    }

    const results = await peopleDiscoveryService.searchProfiles(query, limit, offset);
    res.json(results);
  } catch (error) {
    console.error('Error searching profiles:', error);
    res.status(500).json({ error: 'Failed to search profiles' });
  }
});

export default router;
