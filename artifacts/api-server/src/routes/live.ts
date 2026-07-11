import { Router, type Request, type Response } from 'express';
import { liveService } from '../services/liveService';
import { requireAuth } from '../middlewares/auth';

const router = Router();

/**
 * POST /live
 *
 * Given an authenticated user, when they start a live stream,
 * then a stream key is generated for RTMP ingestion and the stream becomes available to viewers.
 * Concurrent streams per user are limited.
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { title, description, enableRecording } = req.body;

    if (!title || typeof title !== 'string' || title.length > 200) {
      res.status(400).json({ message: 'Invalid title' });
      return;
    }

    if (description && (typeof description !== 'string' || description.length > 500)) {
      res.status(400).json({ message: 'Invalid description' });
      return;
    }

    const stream = await liveService.startStream(userId, {
      title,
      description: description || null,
      enableRecording: enableRecording !== false,
    });

    res.status(201).json(stream);
  } catch (error) {
    if (error instanceof Error && error.message === 'Concurrent stream limit exceeded') {
      res.status(400).json({ message: 'Concurrent stream limit exceeded' });
    } else {
      console.error('Error starting live stream:', error);
      res.status(500).json({ message: 'Failed to start live stream' });
    }
  }
});

/**
 * GET /live/:streamId
 *
 * Given a stream ID, when requested, then the stream details are returned
 * including playback URL, viewer count, and status.
 */
router.get('/:streamId', async (req: Request, res: Response) => {
  try {
    const { streamId } = req.params;
    const streamIdStr = Array.isArray(streamId) ? streamId[0] : streamId;

    const stream = await liveService.getStream(streamIdStr);

    if (!stream) {
      res.status(404).json({ message: 'Live stream not found' });
      return;
    }

    res.json(stream);
  } catch (error) {
    console.error('Error getting live stream:', error);
    res.status(500).json({ message: 'Failed to get live stream' });
  }
});

/**
 * DELETE /live/:streamId
 *
 * Given an authenticated user and their active live stream, when they end it,
 * then the stream is terminated and a replay URL is generated if recording was enabled.
 */
router.delete('/:streamId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { streamId } = req.params;
    const streamIdStr = Array.isArray(streamId) ? streamId[0] : streamId;

    const stream = await liveService.endStream(streamIdStr, userId);

    if (!stream) {
      res.status(404).json({ message: 'Live stream not found' });
      return;
    }

    res.json(stream);
  } catch (error) {
    if (error instanceof Error && error.message === 'Not authorized to end this stream') {
      res.status(403).json({ message: 'Not authorized to end this stream' });
    } else {
      console.error('Error ending live stream:', error);
      res.status(500).json({ message: 'Failed to end live stream' });
    }
  }
});

/**
 * POST /live/:streamId/gifts
 *
 * Given an authenticated user and an active live stream, when they send a gift,
 * then the virtual item is sent and the creator's balance is updated.
 * Gifts have monetary value converted from virtual currency.
 */
router.post('/:streamId/gifts', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { streamId } = req.params;
    const streamIdStr = Array.isArray(streamId) ? streamId[0] : streamId;
    const { giftId, quantity, message } = req.body;

    if (!giftId || typeof giftId !== 'string') {
      res.status(400).json({ message: 'Invalid giftId' });
      return;
    }

    if (quantity && (typeof quantity !== 'number' || quantity < 1 || quantity > 100)) {
      res.status(400).json({ message: 'Invalid quantity' });
      return;
    }

    if (message && (typeof message !== 'string' || message.length > 100)) {
      res.status(400).json({ message: 'Invalid message' });
      return;
    }

    const gift = await liveService.sendGift(streamIdStr, userId, {
      giftId,
      quantity: quantity || 1,
      message: message || null,
    });

    res.status(201).json(gift);
  } catch (error) {
    if (error instanceof Error && error.message === 'Live stream not found') {
      res.status(404).json({ message: 'Live stream not found' });
    } else if (error instanceof Error && error.message === 'Live stream is not active') {
      res.status(404).json({ message: 'Live stream not found or not active' });
    } else {
      console.error('Error sending gift:', error);
      res.status(500).json({ message: 'Failed to send gift' });
    }
  }
});

/**
 * GET /live/:streamId/chat
 *
 * Given a stream ID, when chat messages are requested, then recent messages are returned with pagination.
 */
router.get('/:streamId/chat', async (req: Request, res: Response) => {
  try {
    const { streamId } = req.params;
    const streamIdStr = Array.isArray(streamId) ? streamId[0] : streamId;
    const { limit } = req.query;

    const limitNum = limit ? parseInt(limit as string, 10) : 50;
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      res.status(400).json({ message: 'Invalid limit' });
      return;
    }

    const chat = await liveService.getChatMessages(streamIdStr, limitNum);
    res.json(chat);
  } catch (error) {
    console.error('Error getting live chat:', error);
    res.status(500).json({ message: 'Failed to get live chat' });
  }
});

/**
 * POST /live/:streamId/chat
 *
 * Given an authenticated user and an active live stream, when they send a chat message,
 * then the message is broadcast to all viewers.
 */
router.post('/:streamId/chat', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { streamId } = req.params;
    const streamIdStr = Array.isArray(streamId) ? streamId[0] : streamId;
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.length > 500) {
      res.status(400).json({ message: 'Invalid message' });
      return;
    }

    // Stub: Get username from user profile
    // In production, this would fetch from profiles table
    const username = `user_${userId.slice(0, 8)}`;

    const chatMessage = await liveService.sendChatMessage(
      streamIdStr,
      userId,
      username,
      message
    );

    res.status(201).json(chatMessage);
  } catch (error) {
    if (error instanceof Error && error.message === 'Live stream not found') {
      res.status(404).json({ message: 'Live stream not found' });
    } else if (error instanceof Error && error.message === 'Live stream is not active') {
      res.status(404).json({ message: 'Live stream not found or not active' });
    } else {
      console.error('Error sending chat message:', error);
      res.status(500).json({ message: 'Failed to send chat message' });
    }
  }
});

export default router;
