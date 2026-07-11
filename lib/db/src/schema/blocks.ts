import { pgTable, uuid, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { usersTable } from './users';

// Blocks are bidirectional: when A blocks B, neither can see the other's content
export const blocksTable = pgTable(
  'blocks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    blockerId: uuid('blocker_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    blockedUserId: uuid('blocked_user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Prevent duplicate blocks between the same users
    uniqueBlockerBlocked: uniqueIndex('blocks_blocker_blocked_unique').on(
      table.blockerId,
      table.blockedUserId
    ),
  })
);

// Zod schemas for API validation
export const insertBlockSchema = z.object({
  blockerId: z.string().uuid(),
  blockedUserId: z.string().uuid(),
});

export const selectBlockSchema = createSelectSchema(blocksTable);

// Use Drizzle's built-in type inference to avoid Zod compatibility issues
export type InsertBlock = Omit<typeof blocksTable.$inferInsert, 'id' | 'createdAt'>;
export type Block = typeof blocksTable.$inferSelect;
