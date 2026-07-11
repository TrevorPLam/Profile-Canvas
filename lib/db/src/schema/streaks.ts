import { pgTable, uuid, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { usersTable } from './users';

/**
 * Streaks table for tracking user activity streaks
 */
export const streaksTable = pgTable('streaks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  streakType: text('streak_type').notNull(), // e.g., 'daily_post', 'daily_login', 'daily_comment'
  currentCount: integer('current_count').notNull().default(0),
  longestCount: integer('longest_count').notNull().default(0),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }),
  nextResetAt: timestamp('next_reset_at', { withTimezone: true }),
  frozenDays: integer('frozen_days').notNull().default(0), // Grace period days
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Zod schemas for validation
export const insertStreakSchema = createInsertSchema(streaksTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectStreakSchema = createSelectSchema(streaksTable);

export type InsertStreak = Omit<typeof streaksTable.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>;
export type Streak = typeof streaksTable.$inferSelect;
