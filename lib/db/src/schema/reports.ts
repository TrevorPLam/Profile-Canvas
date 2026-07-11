import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { usersTable } from './users';

export type ReportType = 'user' | 'post' | 'comment';
export type ReportReason = 'harassment' | 'hateSpeech' | 'spam' | 'inappropriateContent' | 'impersonation' | 'violence' | 'selfHarm' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export const reportsTable = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  reporterId: uuid('reporter_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  type: text('type').notNull().$type<ReportType>(),
  targetId: uuid('target_id').notNull(),
  reason: text('reason').notNull().$type<ReportReason>(),
  description: text('description'),
  status: text('status').notNull().$type<ReportStatus>().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Zod schemas for API validation
export const insertReportSchema = z.object({
  reporterId: z.string().uuid(),
  type: z.enum(['user', 'post', 'comment']),
  targetId: z.string().uuid(),
  reason: z.enum(['harassment', 'hateSpeech', 'spam', 'inappropriateContent', 'impersonation', 'violence', 'selfHarm', 'other']),
  description: z.string().max(500).optional(),
  status: z.enum(['pending', 'reviewed', 'resolved', 'dismissed']).optional(),
});

export const reportTypeSchema = z.enum(['user', 'post', 'comment']);
export const reportReasonSchema = z.enum(['harassment', 'hateSpeech', 'spam', 'inappropriateContent', 'impersonation', 'violence', 'selfHarm', 'other']);
export const reportStatusSchema = z.enum(['pending', 'reviewed', 'resolved', 'dismissed']);

export const selectReportSchema = createSelectSchema(reportsTable);

// Use Drizzle's built-in type inference to avoid Zod compatibility issues
export type InsertReport = Omit<typeof reportsTable.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>;
export type Report = typeof reportsTable.$inferSelect;
