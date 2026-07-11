import { pgTable, uuid, text, timestamp, numeric } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { usersTable } from './users';

export const tipsTable = pgTable('tips', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  message: text('message'),
  stripePaymentIntentId: text('stripe_payment_intent_id').notNull().unique(),
  stripeCustomerId: text('stripe_customer_id').notNull(),
  status: text('status').notNull().default('pending'), // pending, succeeded, failed
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const insertTipSchema = createInsertSchema(tipsTable).omit({
  id: true,
  createdAt: true,
});

export const selectTipSchema = createSelectSchema(tipsTable);

export type InsertTip = Omit<typeof tipsTable.$inferInsert, 'id' | 'createdAt'>;
export type Tip = typeof tipsTable.$inferSelect;
