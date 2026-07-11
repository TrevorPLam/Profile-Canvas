import { pgTable, uuid, timestamp, text, boolean, uniqueIndex } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { usersTable } from './users';

export const conversationsTable = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name'), // Nullable for one-to-one conversations, required for groups
    isGroup: boolean('is_group').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  }
);

// Junction table for conversation participants
export const conversationParticipantsTable = pgTable(
  'conversation_participants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversationsTable.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Prevent duplicate user entries in the same conversation
    uniqueConversationUser: uniqueIndex('conversation_participants_conversation_user_unique').on(
      table.conversationId,
      table.userId
    ),
  })
);

// Zod schemas for API validation
export const insertConversationSchema = z.object({
  name: z.string().nullable().optional(),
  isGroup: z.boolean().optional(),
});

export const insertConversationParticipantSchema = z.object({
  conversationId: z.string().uuid(),
  userId: z.string().uuid(),
});

export const selectConversationSchema = createSelectSchema(conversationsTable);
export const selectConversationParticipantSchema = createSelectSchema(conversationParticipantsTable);

// Use Drizzle's built-in type inference to avoid Zod compatibility issues
export type InsertConversation = Omit<
  typeof conversationsTable.$inferInsert,
  'id' | 'createdAt' | 'updatedAt'
>;
export type Conversation = typeof conversationsTable.$inferSelect;
export type InsertConversationParticipant = Omit<
  typeof conversationParticipantsTable.$inferInsert,
  'id' | 'joinedAt'
>;
export type ConversationParticipant = typeof conversationParticipantsTable.$inferSelect;
