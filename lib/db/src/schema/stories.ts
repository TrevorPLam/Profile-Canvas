import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { usersTable } from './users';

export type StoryAudience = 'everyone' | 'friends' | 'custom';
export type StoryMediaType = 'image' | 'video';

export interface StorySticker {
  type: 'emoji' | 'text' | 'mention' | 'location' | 'music';
  x: number;
  y: number;
  rotation: number;
  scale: number;
  content: string;
  style?: Record<string, unknown>;
}

export interface StoryPoll {
  question: string;
  options: string[];
  x: number;
  y: number;
  endsAt?: string;
}

export const storiesTable = pgTable('stories', {
  id: uuid('id').primaryKey().defaultRandom(),
  authorId: uuid('author_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  mediaUrl: text('media_url').notNull(),
  mediaType: text('media_type').notNull().$type<StoryMediaType>(),
  stickers: jsonb('stickers').$type<StorySticker[]>().default([]),
  poll: jsonb('poll').$type<StoryPoll>(),
  audience: text('audience').notNull().$type<StoryAudience>(),
  audienceListId: uuid('audience_list_id'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Zod schemas for API validation
export const storyAudienceSchema = z.enum(['everyone', 'friends', 'custom']);
export const storyMediaTypeSchema = z.enum(['image', 'video']);

export const storyStickerSchema = z.object({
  type: z.enum(['emoji', 'text', 'mention', 'location', 'music']),
  x: z.number(),
  y: z.number(),
  rotation: z.number(),
  scale: z.number(),
  content: z.string(),
  style: z.record(z.unknown()).optional(),
});

export const storyPollSchema = z.object({
  question: z.string().max(100),
  options: z.array(z.string()).min(2).max(4),
  x: z.number(),
  y: z.number(),
  endsAt: z.string().optional(),
});

export const insertStorySchema = createInsertSchema(storiesTable).omit({
  id: true,
  createdAt: true,
});

export const selectStorySchema = createSelectSchema(storiesTable);

// Use Drizzle's built-in type inference to avoid Zod compatibility issues
export type InsertStory = Omit<typeof storiesTable.$inferInsert, 'id' | 'createdAt'>;
export type Story = typeof storiesTable.$inferSelect;
