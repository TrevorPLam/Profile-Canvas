import { Router, type Request, type Response } from 'express';
import { musicService } from '../services/musicService';
import { requireAuth } from '../middlewares/auth';
import { z } from 'zod';

const router = Router();

// Zod schemas for request validation
const musicSearchSchema = z.object({
  query: z.string().min(1).max(100),
  limit: z.number().min(1).max(50).optional(),
  offset: z.number().min(0).optional(),
});

const musicShareSchema = z.object({
  trackId: z.string().min(1),
  provider: z.enum(['spotify', 'appleMusic', 'isrc']),
});

/**
 * GET /music/search
 *
 * Given an authenticated user, when they search for music,
 * then track results are fetched from the external music service.
 */
router.get('/search', requireAuth, async (req: Request, res: Response) => {
  try {
    const input = musicSearchSchema.parse(req.query);

    const results = await musicService.search({
      query: input.query,
      limit: input.limit,
      offset: input.offset,
    });

    res.json(results);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({ message: 'Invalid request' });
    } else if (error instanceof Error && error.message.includes('Rate limit')) {
      res.status(429).json({ message: error.message });
    } else {
      console.error('Error searching music:', error);
      res.status(500).json({ message: 'Failed to search music' });
    }
  }
});

/**
 * POST /music/share
 *
 * Given an authenticated user and a track ID, when they share a track,
 * then a music card is generated with track metadata and deep links.
 */
router.post('/share', requireAuth, async (req: Request, res: Response) => {
  try {
    const input = musicShareSchema.parse(req.body);

    const share = await musicService.share({
      trackId: input.trackId,
      provider: input.provider,
    });

    res.status(201).json(share);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({ message: 'Invalid request' });
    } else if (error instanceof Error && error.message.includes('Rate limit')) {
      res.status(429).json({ message: error.message });
    } else {
      console.error('Error sharing music:', error);
      res.status(500).json({ message: 'Failed to share music' });
    }
  }
});

export default router;
