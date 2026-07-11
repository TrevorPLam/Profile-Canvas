import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { usersTable } from './users';
import { postsTable } from './posts';

export type NotificationType = 'like' | 'comment' | 'friendRequest' | 'friendAccepted' | 'repost' | 'save';

export const notificationsTable = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    recipientId: uuid('recipient_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    actorId: uuid('actor_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    type: text('type').notNull().$type<NotificationType>(),
    postId: uuid('post_id').references(() => postsTable.id, { onDelete: 'cascade' }),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    recipientIndex: index('notifications_recipient_index').on(table.recipientId),
    recipientReadIndex: index('notifications_recipient_read_index').on(table.recipientId, table.readAt),
  })
);

// Zod schemas for API validation
export const insertNotificationSchema = z.object({
  recipientId: z.string().uuid(),
  actorId: z.string().uuid(),
  type: z.enum(['like', 'comment', 'friendRequest', 'friendAccepted', 'repost', 'save']),
  postId: z.string().uuid().nullable(),
});

export const notificationTypeSchema = z.enum(['like', 'comment', 'friendRequest', 'friendAccepted', 'repost', 'save']);

export const selectNotificationSchema = createSelectSchema(notificationsTable);

// Use Drizzle's built-in type inference to avoid Zod compatibility issues
export type InsertNotification = Omit<typeof notificationsTable.$inferInsert, 'id' | 'createdAt'>;
export type Notification = typeof notificationsTable.$inferSelect;
