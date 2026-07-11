import { Router, type Request, type Response } from 'express';
import { audienceService } from '../services/audienceService';
import { requireAuth } from '../middlewares/auth';
import { z } from 'zod';

const router = Router();

// Zod schemas for request validation
const createAudienceListSchema = z.object({
  name: z.string().min(1).max(50),
  emoji: z.string().emoji().optional(),
  memberIds: z.array(z.string().uuid()).optional(),
});

const updateAudienceListSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  emoji: z.string().emoji().optional(),
  memberIds: z.array(z.string().uuid()).optional(),
});

const addMembersSchema = z.object({
  memberIds: z.array(z.string().uuid()).min(1),
});

const removeMembersSchema = z.object({
  memberIds: z.array(z.string().uuid()).min(1),
});

/**
 * POST /audience
 *
 * Given an authenticated user, when they create an audience list,
 * then the list is stored with a unique ID and returned.
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const input = createAudienceListSchema.parse(req.body);

    const list = await audienceService.createList({
      ownerId: userId,
      name: input.name,
      emoji: input.emoji,
      memberIds: input.memberIds,
    });

    res.status(201).json(list);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({ message: 'Invalid request' });
    } else if (error instanceof Error && error.message.includes('Maximum')) {
      res.status(400).json({ message: error.message });
    } else {
      console.error('Error creating audience list:', error);
      res.status(500).json({ message: 'Failed to create audience list' });
    }
  }
});

/**
 * GET /audience
 *
 * Given an authenticated user, when they request their audience lists,
 * then all their lists are returned.
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const response = await audienceService.listLists(userId);
    res.json(response);
  } catch (error) {
    console.error('Error listing audience lists:', error);
    res.status(500).json({ message: 'Failed to list audience lists' });
  }
});

/**
 * GET /audience/:listId
 *
 * Given an authenticated user, when they request a specific audience list,
 * then the list details are returned if they own it.
 */
router.get('/:listId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { listId } = req.params;
    const listIdStr = Array.isArray(listId) ? listId[0] : listId;

    const list = await audienceService.getList(listIdStr, userId);

    if (!list) {
      res.status(404).json({ message: 'Audience list not found' });
      return;
    }

    res.json(list);
  } catch (error) {
    if (error instanceof Error && error.message === 'Not authorized to view this list') {
      res.status(403).json({ message: 'Not authorized to view this list' });
    } else {
      console.error('Error getting audience list:', error);
      res.status(500).json({ message: 'Failed to get audience list' });
    }
  }
});

/**
 * PATCH /audience/:listId
 *
 * Given an authenticated user, when they update their audience list,
 * then the list is updated and returned.
 */
router.patch('/:listId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { listId } = req.params;
    const listIdStr = Array.isArray(listId) ? listId[0] : listId;
    const input = updateAudienceListSchema.parse(req.body);

    const list = await audienceService.updateList({
      listId: listIdStr,
      ownerId: userId,
      name: input.name,
      emoji: input.emoji,
      memberIds: input.memberIds,
    });

    if (!list) {
      res.status(404).json({ message: 'Audience list not found' });
      return;
    }

    res.json(list);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({ message: 'Invalid request' });
    } else if (error instanceof Error && error.message === 'Not authorized to update this list') {
      res.status(403).json({ message: 'Not authorized to update this list' });
    } else if (error instanceof Error && error.message.includes('Maximum')) {
      res.status(400).json({ message: error.message });
    } else {
      console.error('Error updating audience list:', error);
      res.status(500).json({ message: 'Failed to update audience list' });
    }
  }
});

/**
 * DELETE /audience/:listId
 *
 * Given an authenticated user, when they delete their audience list,
 * then the list is deleted.
 */
router.delete('/:listId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { listId } = req.params;
    const listIdStr = Array.isArray(listId) ? listId[0] : listId;

    const deleted = await audienceService.deleteList(listIdStr, userId);

    if (!deleted) {
      res.status(404).json({ message: 'Audience list not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === 'Not authorized to delete this list') {
      res.status(403).json({ message: 'Not authorized to delete this list' });
    } else {
      console.error('Error deleting audience list:', error);
      res.status(500).json({ message: 'Failed to delete audience list' });
    }
  }
});

/**
 * POST /audience/:listId/members
 *
 * Given an authenticated user, when they add members to their audience list,
 * then the members are added silently (no notifications).
 */
router.post('/:listId/members', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { listId } = req.params;
    const listIdStr = Array.isArray(listId) ? listId[0] : listId;
    const input = addMembersSchema.parse(req.body);

    const list = await audienceService.addMembers({
      listId: listIdStr,
      ownerId: userId,
      memberIds: input.memberIds,
    });

    if (!list) {
      res.status(404).json({ message: 'Audience list not found' });
      return;
    }

    res.json(list);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({ message: 'Invalid request' });
    } else if (error instanceof Error && error.message === 'Not authorized to modify this list') {
      res.status(403).json({ message: 'Not authorized to modify this list' });
    } else if (error instanceof Error && error.message.includes('Maximum')) {
      res.status(400).json({ message: error.message });
    } else {
      console.error('Error adding members to audience list:', error);
      res.status(500).json({ message: 'Failed to add members to audience list' });
    }
  }
});

/**
 * DELETE /audience/:listId/members
 *
 * Given an authenticated user, when they remove members from their audience list,
 * then the members are removed silently (no notifications).
 */
router.delete('/:listId/members', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { listId } = req.params;
    const listIdStr = Array.isArray(listId) ? listId[0] : listId;
    const input = removeMembersSchema.parse(req.body);

    const list = await audienceService.removeMembers({
      listId: listIdStr,
      ownerId: userId,
      memberIds: input.memberIds,
    });

    if (!list) {
      res.status(404).json({ message: 'Audience list not found' });
      return;
    }

    res.json(list);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({ message: 'Invalid request' });
    } else if (error instanceof Error && error.message === 'Not authorized to modify this list') {
      res.status(403).json({ message: 'Not authorized to modify this list' });
    } else {
      console.error('Error removing members from audience list:', error);
      res.status(500).json({ message: 'Failed to remove members from audience list' });
    }
  }
});

export default router;
