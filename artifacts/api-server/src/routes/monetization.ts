import { Router, type IRouter } from 'express';
import { MonetizationService } from '../services/monetizationService';
import { requireAuth } from '../middlewares/auth';

const router: IRouter = Router();
const monetizationService = new MonetizationService();

/**
 * POST /tips
 * Send a tip to a creator
 */
router.post('/tips', requireAuth, async (req, res) => {
  try {
    const { creatorId, amount, currency, message } = req.body;

    if (!req.userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    if (!creatorId || !amount) {
      res.status(400).json({ message: 'Missing required fields: creatorId, amount' });
      return;
    }

    const result = await monetizationService.sendTip({
      creatorId,
      senderId: req.userId,
      amount: parseFloat(amount),
      currency,
      message,
    });

    res.status(201).json({
      id: result.tipId,
      creatorId,
      senderId: req.userId,
      amount,
      message: message || null,
      clientSecret: result.clientSecret,
      createdAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'Creator not found') {
        res.status(404).json({ message: 'Creator not found' });
      } else if (error.message === 'Sender not found') {
        res.status(404).json({ message: 'Sender not found' });
      } else if (error.message === 'Stripe is not configured') {
        res.status(500).json({ message: 'Payment service not configured' });
      } else {
        res.status(400).json({ message: error.message || 'Failed to send tip' });
      }
    } else {
      res.status(400).json({ message: 'Failed to send tip' });
    }
  }
});

/**
 * POST /subscriptions
 * Create a subscription to a creator
 */
router.post('/subscriptions', requireAuth, async (req, res) => {
  try {
    const { creatorId, tierId } = req.body;

    if (!req.userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    if (!creatorId || !tierId) {
      res.status(400).json({ message: 'Missing required fields: creatorId, tierId' });
      return;
    }

    const result = await monetizationService.createSubscription({
      creatorId,
      subscriberId: req.userId,
      tierId,
    });

    res.status(201).json({
      id: result.subscriptionId,
      creatorId,
      subscriberId: req.userId,
      tierId,
      status: 'active',
      clientSecret: result.clientSecret,
      createdAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'Creator not found') {
        res.status(404).json({ message: 'Creator not found' });
      } else if (error.message === 'Subscriber not found') {
        res.status(404).json({ message: 'Subscriber not found' });
      } else if (error.message === 'Stripe is not configured') {
        res.status(500).json({ message: 'Payment service not configured' });
      } else {
        res.status(400).json({ message: error.message || 'Failed to create subscription' });
      }
    } else {
      res.status(400).json({ message: 'Failed to create subscription' });
    }
  }
});

/**
 * GET /subscriptions
 * Get user's subscriptions
 */
router.get('/subscriptions', requireAuth, async (req, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const subscriptions = await monetizationService.getUserSubscriptions(req.userId);

    res.status(200).json({
      subscriptions: subscriptions.map((sub) => ({
        id: sub.id,
        creatorId: sub.creatorId,
        subscriberId: sub.subscriberId,
        tierId: sub.tierId,
        status: sub.status,
        currentPeriodStart: sub.currentPeriodStart.toISOString(),
        currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
        createdAt: sub.createdAt.toISOString(),
      })),
      total: subscriptions.length,
    });
  } catch (error: unknown) {
    res.status(400).json({ message: 'Failed to get subscriptions' });
  }
});

/**
 * GET /subscriptions/tiers
 * Get available subscription tiers for a creator
 */
router.get('/subscriptions/tiers', requireAuth, async (req, res) => {
  try {
    const { creatorId } = req.query;

    if (!creatorId || typeof creatorId !== 'string') {
      res.status(400).json({ message: 'Missing required query parameter: creatorId' });
      return;
    }

    const tiers = await monetizationService.getSubscriptionTiers(creatorId);

    res.status(200).json({
      tiers,
      total: tiers.length,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Creator not found') {
      res.status(404).json({ message: 'Creator not found' });
    } else {
      res.status(400).json({ message: 'Failed to get subscription tiers' });
    }
  }
});

/**
 * POST /gifts
 * Send a virtual gift to a creator
 */
router.post('/gifts', requireAuth, async (req, res) => {
  try {
    const { creatorId, giftId, quantity, message } = req.body;

    if (!req.userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    if (!creatorId || !giftId) {
      res.status(400).json({ message: 'Missing required fields: creatorId, giftId' });
      return;
    }

    const result = await monetizationService.sendGift({
      creatorId,
      senderId: req.userId,
      giftId,
      quantity: quantity || 1,
      message,
    });

    res.status(201).json({
      id: result.giftId,
      creatorId,
      senderId: req.userId,
      giftId,
      quantity: quantity || 1,
      message: message || null,
      clientSecret: result.clientSecret,
      createdAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'Creator not found') {
        res.status(404).json({ message: 'Creator not found' });
      } else if (error.message === 'Sender not found') {
        res.status(404).json({ message: 'Sender not found' });
      } else if (error.message === 'Invalid gift type') {
        res.status(400).json({ message: 'Invalid gift type' });
      } else if (error.message === 'Stripe is not configured') {
        res.status(500).json({ message: 'Payment service not configured' });
      } else {
        res.status(400).json({ message: error.message || 'Failed to send gift' });
      }
    } else {
      res.status(400).json({ message: 'Failed to send gift' });
    }
  }
});

/**
 * GET /creator/analytics
 * Get creator monetization analytics
 */
router.get('/creator/analytics', requireAuth, async (req, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { period = 'month' } = req.query;

    if (
      typeof period !== 'string' ||
      !['day', 'week', 'month', 'year'].includes(period)
    ) {
      res.status(400).json({ message: 'Invalid period parameter' });
      return;
    }

    const analytics = await monetizationService.getCreatorAnalytics(
      req.userId,
      period as 'day' | 'week' | 'month' | 'year'
    );

    res.status(200).json(analytics);
  } catch (error: unknown) {
    res.status(400).json({ message: 'Failed to get analytics' });
  }
});

export default router;
