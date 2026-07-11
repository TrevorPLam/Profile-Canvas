import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { usersTable } from './users';

/**
 * Badge criteria interface
 */
export interface BadgeCriteria {
  type: 'streak_count' | 'post_count' | 'engagement_count' | 'custom';
  value: number;
  description: string;
}

/**
 * User badges table for awarded badges
 */
export const userBadgesTable = pgTable('user_badges', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  badgeId: text('badge_id').notNull(), // Reference to badge definition
  name: text('name').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull(), // Emoji or icon URL
  criteria: jsonb('criteria').$type<BadgeCriteria>().notNull(),
  awardedAt: timestamp('awarded_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Zod schemas for validation
export const badgeCriteriaSchema = z.object({
  type: z.enum(['streak_count', 'post_count', 'engagement_count', 'custom']),
  value: z.number(),
  description: z.string(),
});

export const insertUserBadgeSchema = createInsertSchema(userBadgesTable).omit({
  id: true,
  createdAt: true,
});

export const selectUserBadgeSchema = createSelectSchema(userBadgesTable);

export type InsertUserBadge = Omit<typeof userBadgesTable.$inferInsert, 'id' | 'createdAt'>;
export type UserBadge = typeof userBadgesTable.$inferSelect;
