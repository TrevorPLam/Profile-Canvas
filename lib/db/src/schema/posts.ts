import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { usersTable } from './users';

export type PostKind = 'text' | 'video' | 'reel';
export type PostAudience = 'everyone' | 'friends' | 'custom';

export interface RepostInfo {
  originalPostId: string;
  originalAuthorId: string;
}

export interface TextPostContent {
  kind: 'text';
  text: string;
}

export interface VideoPostContent {
  kind: 'video';
  title: string;
  thumbnailUrl: string;
  durationLabel: string;
  viewsLabel: string;
}

export interface ReelPostContent {
  kind: 'reel';
  caption: string;
  thumbnailUrl: string;
  soundLabel: string;
  viewsLabel: string;
}

export type PostContent = TextPostContent | VideoPostContent | ReelPostContent;

export const postsTable = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  authorId: uuid('author_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  kind: text('kind').notNull().$type<PostKind>(),
  content: jsonb('content').$type<PostContent>().notNull(),
  repostOf: jsonb('repost_of').$type<RepostInfo>(),
  topics: text('topics').array().notNull().default([]),
  audience: text('audience').notNull().$type<PostAudience>().default('everyone'),
  audienceListId: uuid('audience_list_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// Zod schemas for content validation (for API validation layer)
export const repostInfoSchema = z.object({
  originalPostId: z.string(),
  originalAuthorId: z.string(),
});

export const textPostContentSchema = z.object({
  kind: z.literal('text'),
  text: z.string(),
});

export const videoPostContentSchema = z.object({
  kind: z.literal('video'),
  title: z.string(),
  thumbnailUrl: z.string(),
  durationLabel: z.string(),
  viewsLabel: z.string(),
});

export const reelPostContentSchema = z.object({
  kind: z.literal('reel'),
  caption: z.string(),
  thumbnailUrl: z.string(),
  soundLabel: z.string(),
  viewsLabel: z.string(),
});

export const postContentSchema = z.discriminatedUnion('kind', [
  textPostContentSchema,
  videoPostContentSchema,
  reelPostContentSchema,
]);

export const insertPostSchema = createInsertSchema(postsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectPostSchema = createSelectSchema(postsTable);

// Use Drizzle's built-in type inference to avoid Zod compatibility issues
export type InsertPost = Omit<typeof postsTable.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>;
export type Post = typeof postsTable.$inferSelect;
