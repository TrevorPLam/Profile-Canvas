import { Router, type Request, type Response } from 'express';
import { messageService } from '../services/messageService';
import { requireAuth } from '../middlewares/auth';
import {
  CreateConversationRequestSchema,
  ConversationListResponseSchema,
  ConversationResponseSchema,
  SendMessageRequestSchema,
  MessageResponseSchema,
  MessageListResponseSchema,
  AddReactionRequestSchema,
  MarkReadResponseSchema,
} from '@workspace/api-zod';

const router = Router();

/**
 * POST /conversations
 *
 * Given an authenticated user and participant user IDs, when they create a conversation,
 * then a new conversation is created with the specified participants.
 */
router.post('/conversations', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const input = CreateConversationRequestSchema.parse(req.body);

    const conversation = await messageService.createConversation({
      name: input.name,
      isGroup: input.isGroup,
      participantIds: input.participantIds,
      currentUserId: userId,
    });

    const response = ConversationListResponseSchema.parse({
      conversations: [conversation],
      total: 1,
    });
    res.status(201).json(response);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({ message: 'Invalid request' });
    } else {
      console.error('Error creating conversation:', error);
      res.status(500).json({ message: 'Failed to create conversation' });
    }
  }
});

/**
 * GET /conversations
 *
 * Given an authenticated user, when they request their conversations,
 * then all conversations they participate in are returned with pagination
 * and the most recent message preview.
 */
router.get('/conversations', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    const result = await messageService.listConversations(userId, limit, offset);

    const response = ConversationListResponseSchema.parse(result);
    res.json(response);
  } catch (error) {
    console.error('Error listing conversations:', error);
    res.status(500).json({ message: 'Failed to list conversations' });
  }
});

/**
 * GET /conversations/:conversationId
 *
 * Given an authenticated user and a conversation ID, when they request the conversation,
 * then the conversation details are returned if the user is a participant.
 */
router.get('/conversations/:conversationId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { conversationId } = req.params;
    const conversationIdStr = Array.isArray(conversationId) ? conversationId[0] : conversationId;

    const conversation = await messageService.getConversation(conversationIdStr, userId);

    if (!conversation) {
      res.status(404).json({ message: 'Conversation not found' });
      return;
    }

    const response = ConversationListResponseSchema.parse({
      conversations: [conversation],
      total: 1,
    });
    res.json(response);
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({ message: 'Failed to get conversation' });
  }
});

/**
 * DELETE /conversations/:conversationId
 *
 * Given an authenticated user and a conversation ID, when they delete the conversation,
 * then the conversation is removed for all participants.
 */
router.delete('/conversations/:conversationId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { conversationId } = req.params;
    const conversationIdStr = Array.isArray(conversationId) ? conversationId[0] : conversationId;

    await messageService.deleteConversation(conversationIdStr, userId);

    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === 'Not authorized to delete this conversation') {
      res.status(403).json({ message: 'Not authorized' });
    } else {
      console.error('Error deleting conversation:', error);
      res.status(500).json({ message: 'Failed to delete conversation' });
    }
  }
});

/**
 * POST /conversations/:conversationId/messages
 *
 * Given an authenticated user and a conversation, when they send a message,
 * then the message is persisted and delivered to all participants via real-time transport.
 */
router.post('/conversations/:conversationId/messages', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { conversationId } = req.params;
    const conversationIdStr = Array.isArray(conversationId) ? conversationId[0] : conversationId;
    const input = SendMessageRequestSchema.parse(req.body);

    const message = await messageService.sendMessage({
      conversationId: conversationIdStr,
      authorId: userId,
      type: input.type,
      content: input.content,
      mediaId: input.mediaId || undefined,
      replyToMessageId: input.replyToMessageId || undefined,
    });

    const response = MessageResponseSchema.parse(message);
    res.status(201).json(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'Not authorized to send messages to this conversation') {
      res.status(403).json({ message: 'Not authorized' });
    } else if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({ message: 'Invalid request' });
    } else {
      console.error('Error sending message:', error);
      res.status(500).json({ message: 'Failed to send message' });
    }
  }
});

/**
 * GET /conversations/:conversationId/messages
 *
 * Given an authenticated user and a conversation, when they request messages,
 * then messages are returned in chronological order with pagination.
 * Read receipts and reactions are included.
 */
router.get('/conversations/:conversationId/messages', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { conversationId } = req.params;
    const conversationIdStr = Array.isArray(conversationId) ? conversationId[0] : conversationId;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    const result = await messageService.listMessages(conversationIdStr, userId, limit, offset);

    const response = MessageListResponseSchema.parse(result);
    res.json(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'Not authorized to view messages in this conversation') {
      res.status(403).json({ message: 'Not authorized' });
    } else {
      console.error('Error listing messages:', error);
      res.status(500).json({ message: 'Failed to list messages' });
    }
  }
});

/**
 * POST /conversations/:conversationId/messages/:messageId/reactions
 *
 * Given an authenticated user and a message, when they add a reaction,
 * then the reaction is recorded and visible to all conversation participants.
 */
router.post(
  '/conversations/:conversationId/messages/:messageId/reactions',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;
      const { messageId } = req.params;
      const messageIdStr = Array.isArray(messageId) ? messageId[0] : messageId;
      const input = AddReactionRequestSchema.parse(req.body);

      await messageService.addReaction(
        {
          messageId: messageIdStr,
          userId,
          emoji: input.emoji,
        },
        userId
      );

      res.status(201).json({ success: true });
    } catch (error) {
      if (error instanceof Error && error.message === 'Message not found') {
        res.status(404).json({ message: 'Message not found' });
      } else if (error instanceof Error && error.message === 'Not authorized to react to messages in this conversation') {
        res.status(403).json({ message: 'Not authorized' });
      } else if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ message: 'Invalid request' });
      } else {
        console.error('Error adding reaction:', error);
        res.status(500).json({ message: 'Failed to add reaction' });
      }
    }
  }
);

/**
 * DELETE /conversations/:conversationId/messages/:messageId/reactions
 *
 * Given an authenticated user and a message, when they remove their reaction,
 * then the reaction is deleted.
 */
router.delete(
  '/conversations/:conversationId/messages/:messageId/reactions',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;
      const { messageId } = req.params;
      const messageIdStr = Array.isArray(messageId) ? messageId[0] : messageId;

      await messageService.removeReaction(messageIdStr, userId);

      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message === 'Message not found') {
        res.status(404).json({ message: 'Message not found' });
      } else if (error instanceof Error && error.message === 'Not authorized to remove reactions in this conversation') {
        res.status(403).json({ message: 'Not authorized' });
      } else {
        console.error('Error removing reaction:', error);
        res.status(500).json({ message: 'Failed to remove reaction' });
      }
    }
  }
);

/**
 * POST /conversations/:conversationId/messages/:messageId/read-receipt
 *
 * Given an authenticated user and a message, when they mark it as read,
 * then a read receipt is recorded with a timestamp.
 * Only the recipient can mark messages as read.
 */
router.post(
  '/conversations/:conversationId/messages/:messageId/read-receipt',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;
      const { messageId } = req.params;
      const messageIdStr = Array.isArray(messageId) ? messageId[0] : messageId;

      await messageService.markAsRead(
        {
          messageId: messageIdStr,
          userId,
        },
        userId
      );

      const response = MarkReadResponseSchema.parse({ success: true });
      res.json(response);
    } catch (error) {
      if (error instanceof Error && error.message === 'Message not found') {
        res.status(404).json({ message: 'Message not found' });
      } else if (error instanceof Error && error.message === 'Not authorized to mark messages as read in this conversation') {
        res.status(403).json({ message: 'Not authorized' });
      } else {
        console.error('Error marking message as read:', error);
        res.status(500).json({ message: 'Failed to mark message as read' });
      }
    }
  }
);

export default router;
