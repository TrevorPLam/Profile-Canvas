import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { usersTable } from './users';

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'past_due',
  'canceled',
  'unpaid',
]);

export const subscriptionsTable = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  subscriberId: uuid('subscriber_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  tierId: text('tier_id').notNull(),
  status: subscriptionStatusEnum('status').notNull().default('active'),
  stripeSubscriptionId: text('stripe_subscription_id').notNull().unique(),
  stripeCustomerId: text('stripe_customer_id').notNull(),
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }).notNull(),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),
  cancelAtPeriodEnd: timestamp('cancel_at_period_end', { withTimezone: true }),
  canceledAt: timestamp('canceled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectSubscriptionSchema = createSelectSchema(subscriptionsTable);

export type InsertSubscription = Omit<typeof subscriptionsTable.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>;
export type Subscription = typeof subscriptionsTable.$inferSelect;
