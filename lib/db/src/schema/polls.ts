import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { postsTable } from './posts';

/**
 * Poll option interface
 */
export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
}

/**
 * Poll vote interface
 */
export interface PollVote {
  userId: string;
  optionId: string;
  votedAt: string;
}

/**
 * Polls table for interactive polls attached to posts
 */
export const pollsTable = pgTable('polls', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id')
    .notNull()
    .references(() => postsTable.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  options: jsonb('options').$type<PollOption[]>().notNull(),
  votes: jsonb('votes').$type<PollVote[]>().notNull().default([]),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Zod schemas for validation
export const pollOptionSchema = z.object({
  id: z.string(),
  text: z.string().min(1).max(100),
  voteCount: z.number().int().min(0).default(0),
});

export const pollVoteSchema = z.object({
  userId: z.string().uuid(),
  optionId: z.string(),
  votedAt: z.string(),
});

export const insertPollSchema = createInsertSchema(pollsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectPollSchema = createSelectSchema(pollsTable);

export type InsertPoll = Omit<typeof pollsTable.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>;
export type Poll = typeof pollsTable.$inferSelect;
