import Stripe from 'stripe';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { db, usersTable, subscriptionsTable, tipsTable, giftsTable } from '@workspace/db';

// Initialize Stripe with environment variable
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
      maxNetworkRetries: 2,
    })
  : null;

// Gift type definitions with conversion rates (virtual currency to USD)
const GIFT_TYPES: Record<string, { monetaryValue: number; name: string }> = {
  rose: { monetaryValue: 0.99, name: 'Rose' },
  diamond: { monetaryValue: 4.99, name: 'Diamond' },
  star: { monetaryValue: 1.99, name: 'Star' },
  heart: { monetaryValue: 0.49, name: 'Heart' },
  crown: { monetaryValue: 9.99, name: 'Crown' },
};

export interface SendTipInput {
  creatorId: string;
  senderId: string;
  amount: number;
  currency?: string;
  message?: string;
}

export interface SendGiftInput {
  creatorId: string;
  senderId: string;
  giftId: string;
  quantity: number;
  message?: string;
}

export interface CreateSubscriptionInput {
  creatorId: string;
  subscriberId: string;
  tierId: string;
}

export interface AnalyticsPeriod {
  period: 'day' | 'week' | 'month' | 'year';
  startDate: Date;
  endDate: Date;
}

export class MonetizationService {
  /**
   * Get or create Stripe customer for a user
   */
  private async getOrCreateCustomer(userId: string, email: string): Promise<string> {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    // Check if user already has a Stripe customer ID stored
    // For now, we'll create a new customer each time (in production, store this in users table)
    const customer = await stripe.customers.create({
      email,
      metadata: { userId },
    });

    return customer.id;
  }

  /**
   * Send a tip to a creator
   */
  async sendTip(input: SendTipInput): Promise<{ tipId: string; clientSecret?: string }> {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    // Verify creator exists
    const creators = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, input.creatorId))
      .limit(1);

    if (creators.length === 0) {
      throw new Error('Creator not found');
    }

    // Verify sender exists
    const senders = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, input.senderId))
      .limit(1);

    if (senders.length === 0) {
      throw new Error('Sender not found');
    }

    const sender = senders[0];
    const stripeCustomerId = await this.getOrCreateCustomer(input.senderId, sender.email);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(input.amount * 100), // Convert to cents
      currency: input.currency || 'usd',
      customer: stripeCustomerId,
      metadata: {
        creatorId: input.creatorId,
        senderId: input.senderId,
        type: 'tip',
      },
      automatic_payment_methods: { enabled: true },
    });

    // Create tip record
    const [tip] = await db
      .insert(tipsTable)
      .values({
        creatorId: input.creatorId,
        senderId: input.senderId,
        amount: input.amount.toString(),
        currency: input.currency || 'USD',
        message: input.message,
        stripePaymentIntentId: paymentIntent.id,
        stripeCustomerId,
        status: 'pending',
      })
      .returning();

    return {
      tipId: tip.id,
      clientSecret: paymentIntent.client_secret || undefined,
    };
  }

  /**
   * Send a virtual gift to a creator
   */
  async sendGift(input: SendGiftInput): Promise<{ giftId: string; clientSecret?: string }> {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    // Validate gift type
    const giftType = GIFT_TYPES[input.giftId];
    if (!giftType) {
      throw new Error('Invalid gift type');
    }

    // Verify creator exists
    const creators = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, input.creatorId))
      .limit(1);

    if (creators.length === 0) {
      throw new Error('Creator not found');
    }

    // Verify sender exists
    const senders = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, input.senderId))
      .limit(1);

    if (senders.length === 0) {
      throw new Error('Sender not found');
    }

    const sender = senders[0];
    const stripeCustomerId = await this.getOrCreateCustomer(input.senderId, sender.email);

    // Calculate total monetary value
    const totalValue = giftType.monetaryValue * input.quantity;

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalValue * 100), // Convert to cents
      currency: 'usd',
      customer: stripeCustomerId,
      metadata: {
        creatorId: input.creatorId,
        senderId: input.senderId,
        giftId: input.giftId,
        quantity: input.quantity.toString(),
        type: 'gift',
      },
      automatic_payment_methods: { enabled: true },
    });

    // Create gift record
    const [gift] = await db
      .insert(giftsTable)
      .values({
        creatorId: input.creatorId,
        senderId: input.senderId,
        giftId: input.giftId,
        quantity: input.quantity,
        monetaryValue: totalValue.toString(),
        currency: 'USD',
        message: input.message,
        stripePaymentIntentId: paymentIntent.id,
        stripeCustomerId,
        status: 'pending',
      })
      .returning();

    return {
      giftId: gift.id,
      clientSecret: paymentIntent.client_secret || undefined,
    };
  }

  /**
   * Create a subscription to a creator
   */
  async createSubscription(input: CreateSubscriptionInput): Promise<{ subscriptionId: string; clientSecret?: string }> {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    // Verify creator exists
    const creators = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, input.creatorId))
      .limit(1);

    if (creators.length === 0) {
      throw new Error('Creator not found');
    }

    // Verify subscriber exists
    const subscribers = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, input.subscriberId))
      .limit(1);

    if (subscribers.length === 0) {
      throw new Error('Subscriber not found');
    }

    const subscriber = subscribers[0];
    const stripeCustomerId = await this.getOrCreateCustomer(input.subscriberId, subscriber.email);

    // In a real implementation, you would have a mapping of tierId to Stripe price ID
    // For now, we'll use the tierId as a placeholder (this would be configured in Stripe)
    const priceId = input.tierId; // This should map to a Stripe Price ID

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        creatorId: input.creatorId,
        subscriberId: input.subscriberId,
        tierId: input.tierId,
      },
    });

    // Create subscription record
    const [sub] = await db
      .insert(subscriptionsTable)
      .values({
        creatorId: input.creatorId,
        subscriberId: input.subscriberId,
        tierId: input.tierId,
        status: subscription.status as any,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      })
      .returning();

    return {
      subscriptionId: sub.id,
      clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret || undefined,
    };
  }

  /**
   * Get user's subscriptions
   */
  async getUserSubscriptions(subscriberId: string) {
    const subscriptions = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.subscriberId, subscriberId))
      .orderBy(desc(subscriptionsTable.createdAt));

    return subscriptions;
  }

  /**
   * Get subscription tiers for a creator
   * In a real implementation, this would fetch from Stripe Products/Prices
   */
  async getSubscriptionTiers(creatorId: string) {
    // Verify creator exists
    const creators = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, creatorId))
      .limit(1);

    if (creators.length === 0) {
      throw new Error('Creator not found');
    }

    // Return mock tiers for now - in production, fetch from Stripe
    return [
      {
        id: 'tier_basic',
        name: 'Basic Supporter',
        description: 'Access to exclusive posts',
        price: 4.99,
        currency: 'USD',
        benefits: ['Exclusive posts', 'Early access'],
      },
      {
        id: 'tier_premium',
        name: 'Premium Fan',
        description: 'All benefits plus direct messages',
        price: 9.99,
        currency: 'USD',
        benefits: ['Exclusive posts', 'Early access', 'Direct messages', 'Custom badge'],
      },
      {
        id: 'tier_vip',
        name: 'VIP Supporter',
        description: 'All benefits plus video calls',
        price: 19.99,
        currency: 'USD',
        benefits: [
          'Exclusive posts',
          'Early access',
          'Direct messages',
          'Custom badge',
          'Monthly video call',
        ],
      },
    ];
  }

  /**
   * Get creator analytics
   */
  async getCreatorAnalytics(creatorId: string, period: 'day' | 'week' | 'month' | 'year' = 'month') {
    const { startDate, endDate } = this.getPeriodDates(period);

    // Get tips in period
    const tips = await db
      .select()
      .from(tipsTable)
      .where(
        and(
          eq(tipsTable.creatorId, creatorId),
          eq(tipsTable.status, 'succeeded'),
          gte(tipsTable.createdAt, startDate),
          lte(tipsTable.createdAt, endDate)
        )
      );

    // Get gifts in period
    const gifts = await db
      .select()
      .from(giftsTable)
      .where(
        and(
          eq(giftsTable.creatorId, creatorId),
          eq(giftsTable.status, 'succeeded'),
          gte(giftsTable.createdAt, startDate),
          lte(giftsTable.createdAt, endDate)
        )
      );

    // Get active subscriptions
    const subscriptions = await db
      .select()
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.creatorId, creatorId),
          eq(subscriptionsTable.status, 'active')
        )
      );

    // Calculate revenue
    const tipsRevenue = tips.reduce((sum, tip) => sum + parseFloat(tip.amount), 0);
    const giftsRevenue = gifts.reduce((sum, gift) => sum + parseFloat(gift.monetaryValue), 0);
    const subscriptionsRevenue = subscriptions.length * 10; // Simplified calculation

    const totalRevenue = tipsRevenue + giftsRevenue + subscriptionsRevenue;

    return {
      period,
      revenue: {
        total: totalRevenue,
        tips: tipsRevenue,
        gifts: giftsRevenue,
        subscriptions: subscriptionsRevenue,
      },
      subscribers: {
        total: subscriptions.length,
        active: subscriptions.filter((s) => s.status === 'active').length,
      },
      engagement: {
        tipsReceived: tips.length,
        giftsReceived: gifts.length,
      },
    };
  }

  /**
   * Helper to get date range for analytics period
   */
  private getPeriodDates(period: 'day' | 'week' | 'month' | 'year'): AnalyticsPeriod {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return {
      period,
      startDate,
      endDate: now,
    };
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const metadata = paymentIntent.metadata;

        if (metadata.type === 'tip') {
          await db
            .update(tipsTable)
            .set({ status: 'succeeded' })
            .where(eq(tipsTable.stripePaymentIntentId, paymentIntent.id));
        } else if (metadata.type === 'gift') {
          await db
            .update(giftsTable)
            .set({ status: 'succeeded' })
            .where(eq(giftsTable.stripePaymentIntentId, paymentIntent.id));
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const metadata = paymentIntent.metadata;

        if (metadata.type === 'tip') {
          await db
            .update(tipsTable)
            .set({ status: 'failed' })
            .where(eq(tipsTable.stripePaymentIntentId, paymentIntent.id));
        } else if (metadata.type === 'gift') {
          await db
            .update(giftsTable)
            .set({ status: 'failed' })
            .where(eq(giftsTable.stripePaymentIntentId, paymentIntent.id));
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        await db
          .update(subscriptionsTable)
          .set({
            status: subscription.status as any,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end && subscription.cancel_at
              ? new Date(subscription.cancel_at * 1000)
              : null,
            canceledAt: subscription.canceled_at
              ? new Date(subscription.canceled_at * 1000)
              : null,
            updatedAt: new Date(),
          })
          .where(eq(subscriptionsTable.stripeSubscriptionId, subscription.id));
        break;
      }
    }
  }
}

// Export singleton instance
export const monetizationService = new MonetizationService();
