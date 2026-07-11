import { z } from 'zod';
import { AuthorProfileSchema, AuthorProfile } from './comments';

/**
 * Message reaction schema
 */
export const MessageReactionSchema = z.object({
  userId: z.string(),
  emoji: z.string(),
  createdAt: z.string(),
});

export type MessageReaction = z.infer<typeof MessageReactionSchema>;

/**
 * Message read receipt schema
 */
export const MessageReadReceiptSchema = z.object({
  userId: z.string(),
  readAt: z.string(),
});

export type MessageReadReceipt = z.infer<typeof MessageReadReceiptSchema>;

/**
 * Message type enum
 */
export const MessageTypeSchema = z.enum(['text', 'image', 'video', 'audio', 'system']);

export type MessageType = z.infer<typeof MessageTypeSchema>;

/**
 * Create conversation request schema
 */
export const CreateConversationRequestSchema = z.object({
  participantIds: z.array(z.string()),
  name: z.string().nullable(),
  isGroup: z.boolean(),
});

export type CreateConversationRequest = z.infer<typeof CreateConversationRequestSchema>;

/**
 * Conversation response schema
 */
export const ConversationResponseSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  isGroup: z.boolean(),
  participantIds: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ConversationResponse = z.infer<typeof ConversationResponseSchema>;

/**
 * Conversation list response schema
 */
export const ConversationListResponseSchema = z.object({
  conversations: z.array(
    ConversationResponseSchema.extend({
      participants: z.array(AuthorProfileSchema),
      lastMessage: z
        .object({
          id: z.string(),
          content: z.string(),
          type: MessageTypeSchema,
          authorId: z.string(),
          createdAt: z.string(),
        })
        .nullable(),
      unreadCount: z.number(),
    })
  ),
  total: z.number(),
});

export type ConversationListResponse = z.infer<typeof ConversationListResponseSchema>;

/**
 * Send message request schema
 */
export const SendMessageRequestSchema = z.object({
  type: MessageTypeSchema,
  content: z.string(),
  mediaId: z.string().uuid().nullable().optional(),
  replyToMessageId: z.string().uuid().nullable().optional(),
});

export type SendMessageRequest = z.infer<typeof SendMessageRequestSchema>;

/**
 * Message response schema
 */
export const MessageResponseSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  author: AuthorProfileSchema,
  type: MessageTypeSchema,
  content: z.string(),
  mediaId: z.string().nullable(),
  replyToMessageId: z.string().nullable(),
  reactions: z.array(MessageReactionSchema),
  readReceipts: z.array(MessageReadReceiptSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type MessageResponse = z.infer<typeof MessageResponseSchema>;

/**
 * Message list response schema
 */
export const MessageListResponseSchema = z.object({
  messages: z.array(MessageResponseSchema),
  total: z.number(),
});

export type MessageListResponse = z.infer<typeof MessageListResponseSchema>;

/**
 * Add reaction request schema
 */
export const AddReactionRequestSchema = z.object({
  emoji: z.string(),
});

export type AddReactionRequest = z.infer<typeof AddReactionRequestSchema>;

/**
 * Mark read response schema
 */
export const MarkReadResponseSchema = z.object({
  success: z.boolean(),
});

export type MarkReadResponse = z.infer<typeof MarkReadResponseSchema>;
