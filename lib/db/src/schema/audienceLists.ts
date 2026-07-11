import { pgTable, uuid, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { usersTable } from './users';

export const audienceListsTable = pgTable(
  'audience_lists',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    emoji: text('emoji'),
    memberIds: text('member_ids').array().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Ensure each list name is unique per user
    uniqueOwnerName: uniqueIndex('audience_lists_owner_name_unique').on(
      table.ownerId,
      table.name
    ),
  })
);

// Zod schemas for API validation
export const insertAudienceListSchema = z.object({
  ownerId: z.string().uuid(),
  name: z.string().min(1).max(50),
  emoji: z.string().emoji().optional(),
  memberIds: z.array(z.string().uuid()).default([]),
});

export const selectAudienceListSchema = createSelectSchema(audienceListsTable);

// Use Drizzle's built-in type inference to avoid Zod compatibility issues
export type InsertAudienceList = Omit<typeof audienceListsTable.$inferInsert, 'id' | 'createdAt'>;
export type AudienceList = typeof audienceListsTable.$inferSelect;
