import { Router, type Request, type Response } from 'express';
import { friendshipService } from '../services/friendshipService';
import { requireAuth } from '../middlewares/auth';
import { z } from 'zod';

const router = Router();

// Validation schemas
const sendFriendRequestSchema = z.object({
  targetUserId: z.string().uuid(),
});

const removeFriendSchema = z.object({
  friendUserId: z.string().uuid(),
});

const topFriendsUpdateSchema = z.object({
  topFriends: z.array(z.string().uuid()),
});

/**
 * POST /friends/requests
 * 
 * Given an authenticated user and a target user ID, when they send a friend request,
 * then a pending request is created if one does not already exist. Duplicate requests are rejected.
 */
router.post('/requests', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const validationResult = sendFriendRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({ message: 'Invalid request body' });
      return;
    }

    const { targetUserId } = validationResult.data;

    const result = await friendshipService.sendRequest(userId, targetUserId);

    if (!result) {
      res.status(409).json({ message: 'Friend request already exists or users are already friends' });
      return;
    }

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Cannot send friend request to yourself') {
      res.status(400).json({ message: error.message });
      return;
    }

    console.error('Error sending friend request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /friends/requests
 * 
 * Given an authenticated user, when they request their friend requests,
 * then incoming and outgoing requests are returned with pagination.
 */
router.get('/requests', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const type = (req.query.type as 'incoming' | 'outgoing') || 'incoming';

    if (type !== 'incoming' && type !== 'outgoing') {
      res.status(400).json({ message: 'Invalid type parameter' });
      return;
    }

    const result = await friendshipService.listRequests(userId, type);
    res.json(result);
  } catch (error) {
    console.error('Error listing friend requests:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /friends/requests/:requestId
 * 
 * Given an authenticated user and an incoming friend request, when they accept it,
 * then a symmetric friendship is created and the request is marked as accepted.
 * Only the recipient can accept.
 */
router.post('/requests/:requestId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const requestId = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId;

    const result = await friendshipService.acceptRequest(requestId, userId);

    if (!result) {
      res.status(404).json({ message: 'Friend request not found' });
      return;
    }

    res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Not authorized to accept this request') {
      res.status(403).json({ message: error.message });
      return;
    }

    console.error('Error accepting friend request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * DELETE /friends/requests/:requestId
 * 
 * Given an authenticated user and an outgoing friend request, when they cancel it,
 * then the request is removed. Only the sender can cancel pending requests.
 */
router.delete('/requests/:requestId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const requestId = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId;

    const result = await friendshipService.cancelRequest(requestId, userId);

    if (!result) {
      res.status(404).json({ message: 'Friend request not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === 'Not authorized to cancel this request') {
      res.status(403).json({ message: error.message });
      return;
    }

    console.error('Error canceling friend request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /friends/requests/:requestId/decline
 * 
 * Given an authenticated user and an incoming friend request, when they decline it,
 * then the request is marked as declined. Only the recipient can decline.
 */
router.post('/requests/:requestId/decline', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const requestId = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId;

    const result = await friendshipService.declineRequest(requestId, userId);

    if (!result) {
      res.status(404).json({ message: 'Friend request not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === 'Not authorized to decline this request') {
      res.status(403).json({ message: error.message });
      return;
    }

    console.error('Error declining friend request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /friends
 * 
 * Given an authenticated user, when they request their friends list,
 * then all friends are returned with pagination and profile information.
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const result = await friendshipService.listFriends(userId);
    res.json(result);
  } catch (error) {
    console.error('Error listing friends:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * DELETE /friends
 * 
 * Given an authenticated user and a friend user ID, when they remove the friend,
 * then the symmetric friendship is deleted for both users.
 */
router.delete('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const validationResult = removeFriendSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({ message: 'Invalid request body' });
      return;
    }

    const { friendUserId } = validationResult.data;

    const result = await friendshipService.removeFriend(userId, friendUserId);

    if (!result) {
      res.status(404).json({ message: 'Friendship not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
