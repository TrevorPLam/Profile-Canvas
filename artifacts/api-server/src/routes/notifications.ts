import { Router, type Request, type Response } from 'express';
import { notificationService } from '../services/notificationService';
import { requireAuth } from '../middlewares/auth';

const router = Router();

/**
 * GET /notifications
 * 
 * Given an authenticated user, when they request their notifications,
 * then they receive a paginated list of notifications with actor and post details.
 * The response includes total count and unread count.
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const unreadOnly = req.query.unreadOnly === 'true';
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const [notifications, total, unreadCount] = await Promise.all([
      notificationService.listForRecipient(userId, unreadOnly, limit, offset),
      notificationService.countForRecipient(userId),
      notificationService.countUnreadForRecipient(userId),
    ]);

    res.status(200).json({
      notifications,
      total,
      unreadCount,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error listing notifications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * PATCH /notifications
 * 
 * Given an authenticated user, when they mark all notifications as read,
 * then all unread notifications are marked as read and the count is returned.
 */
router.patch('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const count = await notificationService.markAllAsRead(userId);
    res.status(200).json({ count });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * PATCH /notifications/:notificationId
 * 
 * Given an authenticated user, when they mark a specific notification as read,
 * then the notification is marked as read if they are the recipient.
 */
router.patch('/:notificationId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const notificationId = Array.isArray(req.params.notificationId)
      ? req.params.notificationId[0]
      : req.params.notificationId;

    const notification = await notificationService.markAsRead(notificationId, userId);
    if (!notification) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    res.status(200).json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /notifications/stream
 * 
 * Given an authenticated user, when they connect to the SSE stream,
 * then they receive real-time notifications as they are created.
 * The stream sends a heartbeat every 30 seconds and closes after 15 minutes.
 */
router.get('/stream', requireAuth, (req: Request, res: Response) => {
  const userId = req.userId!;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', userId })}\n\n`);

  // Heartbeat interval (30 seconds)
  const heartbeatInterval = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 30000);

  // Max connection duration (15 minutes)
  const maxDuration = 15 * 60 * 1000;
  const timeout = setTimeout(() => {
    cleanup();
    res.end();
  }, maxDuration);

  // Cleanup function
  const cleanup = () => {
    clearInterval(heartbeatInterval);
    clearTimeout(timeout);
    notificationService.removeListener('notification', handleNotification);
    notificationService.removeListener('notifications-read', handleNotificationsRead);
  };

  // Handle new notifications
  const handleNotification = (notification: { recipientId: string; [key: string]: unknown }) => {
    if (notification.recipientId === userId) {
      res.write(`data: ${JSON.stringify({ type: 'notification', data: notification })}\n\n`);
    }
  };

  // Handle notifications marked as read
  const handleNotificationsRead = (data: { recipientId: string; count: number }) => {
    if (data.recipientId === userId) {
      res.write(`data: ${JSON.stringify({ type: 'notifications-read', count: data.count })}\n\n`);
    }
  };

  // Listen for notification events
  notificationService.on('notification', handleNotification);
  notificationService.on('notifications-read', handleNotificationsRead);

  // Cleanup on client disconnect
  req.on('close', cleanup);
  req.on('end', cleanup);
});

export default router;
