import { pgTable, uuid, text, timestamp, numeric, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { usersTable } from './users';

export const giftsTable = pgTable('gifts', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  giftId: text('gift_id').notNull(), // ID of the gift type (e.g., 'rose', 'diamond')
  quantity: integer('quantity').notNull().default(1),
  monetaryValue: numeric('monetary_value', { precision: 10, scale: 2 }).notNull(), // Converted value in creator's currency
  currency: text('currency').notNull().default('USD'),
  message: text('message'),
  stripePaymentIntentId: text('stripe_payment_intent_id').notNull().unique(),
  stripeCustomerId: text('stripe_customer_id').notNull(),
  status: text('status').notNull().default('pending'), // pending, succeeded, failed
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const insertGiftSchema = createInsertSchema(giftsTable).omit({
  id: true,
  createdAt: true,
});

export const selectGiftSchema = createSelectSchema(giftsTable);

export type InsertGift = Omit<typeof giftsTable.$inferInsert, 'id' | 'createdAt'>;
export type Gift = typeof giftsTable.$inferSelect;
