import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { usersTable } from './users';

export const sessionsTable = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const insertSessionSchema = createInsertSchema(sessionsTable).omit({
  id: true,
  createdAt: true,
});

export const selectSessionSchema = createSelectSchema(sessionsTable);

// Use Drizzle's built-in type inference to avoid Zod compatibility issues
export type InsertSession = Omit<typeof sessionsTable.$inferInsert, 'id' | 'createdAt'>;
export type Session = typeof sessionsTable.$inferSelect;
