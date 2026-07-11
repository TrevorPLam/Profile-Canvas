import { pgTable, uuid, text, doublePrecision, timestamp, index } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { usersTable } from './users';

export const locationsTable = pgTable(
  'locations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    placeName: text('place_name'),
    accuracyMeters: doublePrecision('accuracy_meters'),
    sharedWithListId: uuid('shared_with_list_id').references(
      () => audienceListsTable.id,
      { onDelete: 'set null' }
    ),
    excludedFriendIds: text('excluded_friend_ids').array().notNull().default([]),
    enabled: text('enabled').notNull().default('true'), // Boolean as text for PostgreSQL compatibility
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Index for querying active locations by user
    userIdIdx: index('locations_user_id_idx').on(table.userId),
    // Index for querying locations by expiration (for cleanup)
    expiresAtIdx: index('locations_expires_at_idx').on(table.expiresAt),
    // Index for querying locations by audience list
    sharedWithListIdIdx: index('locations_shared_with_list_id_idx').on(table.sharedWithListId),
  })
);

// Import audienceListsTable for reference (circular import handled by Drizzle)
import { audienceListsTable } from './audienceLists';

// Zod schemas for API validation
export const insertLocationSchema = z.object({
  userId: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  placeName: z.string().max(255).optional(),
  accuracyMeters: z.number().min(0).optional(),
  sharedWithListId: z.string().uuid().nullable().optional(),
  excludedFriendIds: z.array(z.string().uuid()).default([]),
  enabled: z.string().default('true'),
  expiresAt: z.coerce.date(),
});

export const selectLocationSchema = createSelectSchema(locationsTable);

// Use Drizzle's built-in type inference to avoid Zod compatibility issues
export type InsertLocation = Omit<typeof locationsTable.$inferInsert, 'id' | 'updatedAt'>;
export type Location = typeof locationsTable.$inferSelect;
