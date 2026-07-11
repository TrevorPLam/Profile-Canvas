import { pgTable, uuid, timestamp, text, jsonb, index } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { usersTable } from './users';
import { conversationsTable } from './conversations';

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'system';

export interface MessageReaction {
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface MessageReadReceipt {
  userId: string;
  readAt: string;
}

export const messagesTable = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversationsTable.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    type: text('type').notNull().$type<MessageType>().default('text'),
    content: text('content').notNull(), // Text content or media URL
    mediaId: text('media_id'), // Reference to uploaded media for image/video/audio
    replyToMessageId: uuid('reply_to_message_id'), // For message threading - will be set as self-reference in migration
    reactions: jsonb('reactions').$type<MessageReaction[]>().default([]),
    readReceipts: jsonb('read_receipts').$type<MessageReadReceipt[]>().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Index for efficient message retrieval by conversation
    conversationIdx: index('messages_conversation_idx').on(table.conversationId),
    // Index for efficient message retrieval by author
    authorIdx: index('messages_author_idx').on(table.authorId),
    // Index for chronological ordering
    createdAtIdx: index('messages_created_at_idx').on(table.createdAt),
  })
);

// Zod schemas for API validation
export const messageReactionSchema = z.object({
  userId: z.string().uuid(),
  emoji: z.string(),
  createdAt: z.string(),
});

export const messageReadReceiptSchema = z.object({
  userId: z.string().uuid(),
  readAt: z.string(),
});

export const messageTypeSchema = z.enum(['text', 'image', 'video', 'audio', 'system']);

export const insertMessageSchema = z.object({
  conversationId: z.string().uuid(),
  authorId: z.string().uuid(),
  type: messageTypeSchema.optional(),
  content: z.string(),
  mediaId: z.string().uuid().nullable().optional(),
  replyToMessageId: z.string().uuid().nullable().optional(),
  reactions: z.array(messageReactionSchema).optional(),
  readReceipts: z.array(messageReadReceiptSchema).optional(),
});

export const selectMessageSchema = createSelectSchema(messagesTable);

// Use Drizzle's built-in type inference to avoid Zod compatibility issues
export type InsertMessage = Omit<
  typeof messagesTable.$inferInsert,
  'id' | 'createdAt' | 'updatedAt'
>;
export type Message = typeof messagesTable.$inferSelect;
