import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { postsTable } from './posts';
import { usersTable } from './users';

export const commentsTable = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id')
    .notNull()
    .references(() => postsTable.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Zod schema with additional validation for API layer
export const insertCommentSchema = z.object({
  postId: z.string().uuid(),
  authorId: z.string().uuid(),
  text: z.string().min(1, 'Comment text cannot be empty'),
});

export const selectCommentSchema = createSelectSchema(commentsTable);

// Use Drizzle's built-in type inference to avoid Zod compatibility issues
export type InsertComment = Omit<typeof commentsTable.$inferInsert, 'id' | 'createdAt'>;
export type Comment = typeof commentsTable.$inferSelect;
