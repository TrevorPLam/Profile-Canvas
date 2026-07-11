import { pgTable, uuid, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { usersTable } from './users';

// Mutes are unidirectional: when A mutes B, A doesn't see B's content but B can still interact with A
export const mutesTable = pgTable(
  'mutes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    muterId: uuid('muter_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    mutedUserId: uuid('muted_user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Prevent duplicate mutes between the same users
    uniqueMuterMuted: uniqueIndex('mutes_muter_muted_unique').on(
      table.muterId,
      table.mutedUserId
    ),
  })
);

// Zod schemas for API validation
export const insertMuteSchema = z.object({
  muterId: z.string().uuid(),
  mutedUserId: z.string().uuid(),
});

export const selectMuteSchema = createSelectSchema(mutesTable);

// Use Drizzle's built-in type inference to avoid Zod compatibility issues
export type InsertMute = Omit<typeof mutesTable.$inferInsert, 'id' | 'createdAt'>;
export type Mute = typeof mutesTable.$inferSelect;
