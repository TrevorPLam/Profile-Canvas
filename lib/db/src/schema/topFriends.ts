import { pgTable, uuid, timestamp, integer, uniqueIndex } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { usersTable } from './users';

export const topFriendsTable = pgTable(
  'top_friends',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    friendId: uuid('friend_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    order: integer('order').notNull(), // 1-indexed ranking
    addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
    removedAt: timestamp('removed_at', { withTimezone: true }), // Nullable for active top friends
  },
  (table) => ({
    // Ensure a user can only have each friend once in their top friends
    uniqueUserFriend: uniqueIndex('top_friends_user_friend_unique').on(
      table.userId,
      table.friendId
    ),
    // Ensure order is unique per user
    uniqueUserOrder: uniqueIndex('top_friends_user_order_unique').on(
      table.userId,
      table.order
    ),
  })
);

// Zod schemas for API validation
export const insertTopFriendSchema = z.object({
  userId: z.string().uuid(),
  friendId: z.string().uuid(),
  order: z.number().int().positive(),
});

export const selectTopFriendSchema = createSelectSchema(topFriendsTable);

// Use Drizzle's built-in type inference to avoid Zod compatibility issues
export type InsertTopFriend = Omit<typeof topFriendsTable.$inferInsert, 'id' | 'addedAt' | 'removedAt'>;
export type TopFriend = typeof topFriendsTable.$inferSelect;
