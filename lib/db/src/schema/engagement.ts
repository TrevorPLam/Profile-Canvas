import { pgTable, uuid, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { postsTable } from './posts';
import { usersTable } from './users';

export const likesTable = pgTable(
  'likes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    postId: uuid('post_id')
      .notNull()
      .references(() => postsTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueUserPost: uniqueIndex('likes_user_post_unique').on(table.userId, table.postId),
  })
);

export const savesTable = pgTable(
  'saves',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    postId: uuid('post_id')
      .notNull()
      .references(() => postsTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueUserPost: uniqueIndex('saves_user_post_unique').on(table.userId, table.postId),
  })
);

// Zod schemas for API validation
export const insertLikeSchema = z.object({
  userId: z.string().uuid(),
  postId: z.string().uuid(),
});

export const insertSaveSchema = z.object({
  userId: z.string().uuid(),
  postId: z.string().uuid(),
});

export const selectLikeSchema = createSelectSchema(likesTable);
export const selectSaveSchema = createSelectSchema(savesTable);

// Use Drizzle's built-in type inference to avoid Zod compatibility issues
export type InsertLike = Omit<typeof likesTable.$inferInsert, 'id' | 'createdAt'>;
export type Like = typeof likesTable.$inferSelect;
export type InsertSave = Omit<typeof savesTable.$inferInsert, 'id' | 'createdAt'>;
export type Save = typeof savesTable.$inferSelect;
