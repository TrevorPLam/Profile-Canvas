import { Router, type Request, type Response } from 'express';
import { profileService } from '../services/profileService';
import { friendshipService } from '../services/friendshipService';
import { requireAuth, optionalAuth } from '../middlewares/auth';
import { z } from 'zod';

const router = Router();

// Validation schema for top friends
const topFriendsUpdateSchema = z.object({
  topFriends: z.array(z.string().uuid()),
});

/**
 * GET /profiles/:handle
 * 
 * Given a profile handle, when an authenticated or unauthenticated viewer requests it,
 * then only modules with appropriate visibility are returned based on viewer relationship.
 */
router.get('/:handle', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { handle } = req.params;
    // Express params can be string or string[], but our route pattern ensures it's a string
    const handleStr = Array.isArray(handle) ? handle[0] : handle;
    const viewerId = req.userId || null;

    const profile = await profileService.getProfileForViewer(handleStr, viewerId);

    if (!profile) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }

    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /profiles/me
 * 
 * Given an authenticated user, when they request their own profile,
 * then all modules are returned regardless of visibility settings.
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const profile = await profileService.getMyProfile(userId);

    if (!profile) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }

    res.json(profile);
  } catch (error) {
    console.error('Error fetching my profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * PATCH /profiles/me
 * 
 * Given an authenticated user, when they update their profile,
 * then allowed fields and module settings are persisted atomically.
 * Immutable fields (userId, joinedAt) are rejected.
 */
router.patch('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    // Reject immutable fields
    if ('userId' in req.body || 'joinedAt' in req.body || 'handle' in req.body) {
      res.status(400).json({ message: 'Cannot update immutable fields: userId, joinedAt, handle' });
      return;
    }

    const updatedProfile = await profileService.updateProfile(userId, req.body);

    if (!updatedProfile) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }

    res.json(updatedProfile);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid module settings')) {
      res.status(400).json({ message: error.message });
      return;
    }

    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /profiles/me/top-friends
 * 
 * Given an authenticated user, when they request their top friends,
 * then the list of top friend user IDs is returned.
 */
router.get('/me/top-friends', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const result = await friendshipService.getTopFriends(userId);

    if (!result) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching top friends:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * PATCH /profiles/me/top-friends
 * 
 * Given an authenticated user, when they update their top friends,
 * then the list of top friend user IDs is persisted.
 */
router.patch('/me/top-friends', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const validationResult = topFriendsUpdateSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({ message: 'Invalid request body' });
      return;
    }

    const { topFriends } = validationResult.data;

    const result = await friendshipService.setTopFriends(userId, topFriends);

    if (!result) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }

    res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Cannot have more than')) {
      res.status(400).json({ message: error.message });
      return;
    }
    if (error instanceof Error && error.message === 'Top friends must be unique') {
      res.status(400).json({ message: error.message });
      return;
    }
    if (error instanceof Error && error.message === 'Top friends must be a subset of friends') {
      res.status(400).json({ message: error.message });
      return;
    }

    console.error('Error updating top friends:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
