import { pgTable, uuid, timestamp, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { usersTable } from './users';

export type FriendRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export const friendRequestsTable = pgTable(
  'friend_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    senderId: uuid('sender_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    receiverId: uuid('receiver_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    status: text('status').notNull().$type<FriendRequestStatus>().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Prevent duplicate pending requests between the same users
    uniqueSenderReceiver: uniqueIndex('friend_requests_sender_receiver_unique').on(
      table.senderId,
      table.receiverId
    ),
  })
);

// Symmetric friendship table using single-row model with CHECK constraint
// This ensures each friendship is stored once with userId < friendId
export const friendshipsTable = pgTable(
  'friendships',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    friendId: uuid('friend_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Unique constraint on the pair to prevent duplicates
    // Note: Ordering (userId < friendId) is enforced in the repository layer
    uniqueUserFriend: uniqueIndex('friendships_user_friend_unique').on(
      table.userId,
      table.friendId
    ),
  })
);

// Zod schemas for API validation
export const insertFriendRequestSchema = z.object({
  senderId: z.string().uuid(),
  receiverId: z.string().uuid(),
  status: z.enum(['pending', 'accepted', 'declined', 'cancelled']).optional(),
});

export const friendRequestStatusSchema = z.enum(['pending', 'accepted', 'declined', 'cancelled']);

export const insertFriendshipSchema = z.object({
  userId: z.string().uuid(),
  friendId: z.string().uuid(),
});

export const selectFriendRequestSchema = createSelectSchema(friendRequestsTable);
export const selectFriendshipSchema = createSelectSchema(friendshipsTable);

// Use Drizzle's built-in type inference to avoid Zod compatibility issues
export type InsertFriendRequest = Omit<
  typeof friendRequestsTable.$inferInsert,
  'id' | 'createdAt' | 'updatedAt'
>;
export type FriendRequest = typeof friendRequestsTable.$inferSelect;
export type InsertFriendship = Omit<typeof friendshipsTable.$inferInsert, 'createdAt'>;
export type Friendship = typeof friendshipsTable.$inferSelect;
