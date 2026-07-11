import { Router, type Request, type Response } from 'express';
import { locationService } from '../services/locationService';
import { requireAuth } from '../middlewares/auth';
import { z } from 'zod';

const router = Router();

// Zod schemas for request validation
const shareLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  placeName: z.string().max(255).optional(),
  accuracyMeters: z.number().min(0).optional(),
  audienceListId: z.string().uuid().nullable().optional(),
  excludedFriendIds: z.array(z.string().uuid()).optional(),
  expiresAt: z.coerce.date().optional(),
});

const updateLocationSchema = z.object({
  audienceListId: z.string().uuid().nullable().optional(),
  excludedFriendIds: z.array(z.string().uuid()).optional(),
  expiresAt: z.coerce.date().optional(),
  enabled: z.boolean().optional(),
});

/**
 * POST /location/share
 *
 * Given an authenticated user, when they share their location,
 * then their last known location is stored with an expiration time.
 */
router.post('/share', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const input = shareLocationSchema.parse(req.body);

    const location = await locationService.shareLocation({
      userId,
      latitude: input.latitude,
      longitude: input.longitude,
      placeName: input.placeName,
      accuracyMeters: input.accuracyMeters,
      audienceListId: input.audienceListId || undefined,
      excludedFriendIds: input.excludedFriendIds,
      expiresAt: input.expiresAt,
    });

    res.status(201).json(location);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({ message: 'Invalid request' });
    } else {
      console.error('Error sharing location:', error);
      res.status(500).json({ message: 'Failed to share location' });
    }
  }
});

/**
 * PATCH /location/share
 *
 * Given an authenticated user, when they update their location sharing settings,
 * then the audience list and expiration are updated.
 */
router.patch('/share', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const input = updateLocationSchema.parse(req.body);

    // Get user's current location
    const currentLocation = await locationService.getUserLocation(userId);
    if (!currentLocation) {
      res.status(404).json({ message: 'Location share not found' });
      return;
    }

    const location = await locationService.updateLocation({
      locationId: currentLocation.id,
      userId,
      audienceListId: input.audienceListId,
      excludedFriendIds: input.excludedFriendIds,
      expiresAt: input.expiresAt,
      enabled: input.enabled,
    });

    if (!location) {
      res.status(404).json({ message: 'Location share not found' });
      return;
    }

    res.json(location);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({ message: 'Invalid request' });
    } else if (error instanceof Error && error.message === 'Not authorized to update this location') {
      res.status(403).json({ message: 'Not authorized to update this location' });
    } else {
      console.error('Error updating location share:', error);
      res.status(500).json({ message: 'Failed to update location share' });
    }
  }
});

/**
 * GET /location/map
 *
 * Given an authenticated user, when they request the location map,
 * then location-tagged content from friends is displayed.
 */
router.get('/map', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;

    // Get friend IDs from friendship service
    // For now, we'll use a placeholder - in a real implementation,
    // you'd query the friendship repository to get friend IDs
    const friendIds: string[] = [];

    const response = await locationService.getLocationMap(userId, friendIds, limit, offset);
    res.json(response);
  } catch (error) {
    console.error('Error getting location map:', error);
    res.status(500).json({ message: 'Failed to get location map' });
  }
});

export default router;
