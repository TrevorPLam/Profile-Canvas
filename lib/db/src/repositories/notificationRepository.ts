import { eq, and, desc, count, isNull } from 'drizzle-orm';
import { db } from '../index';
import { notificationsTable, type Notification, type InsertNotification } from '../schema';

/**
 * Domain types for notification repository
 * These hide the underlying Drizzle table structure from callers
 */

export interface NotificationWithActor {
  id: string;
  recipientId: string;
  actorId: string;
  type: 'like' | 'comment' | 'friendRequest' | 'friendAccepted' | 'repost' | 'save';
  postId: string | null;
  readAt: Date | null;
  createdAt: Date;
}

/**
 * NotificationRepository encapsulates all notification data access logic.
 *
 * Deep module: Hides Drizzle internals, pagination, and read status logic
 * behind a simple interface of domain operations.
 */
export class NotificationRepository {
  /**
   * Create a notification
   * @param notification - The notification data
   * @returns The created notification
   */
  async create(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notificationsTable).values(notification).returning();
    return result[0];
  }

  /**
   * List notifications for a recipient with pagination
   * @param recipientId - The recipient's UUID
   * @param unreadOnly - If true, only return unread notifications
   * @param limit - Maximum number of notifications to return
   * @param offset - Number of notifications to skip
   * @returns List of notifications
   */
  async listForRecipient(
    recipientId: string,
    unreadOnly: boolean = false,
    limit: number = 50,
    offset: number = 0
  ): Promise<NotificationWithActor[]> {
    const conditions = [eq(notificationsTable.recipientId, recipientId)];

    if (unreadOnly) {
      conditions.push(isNull(notificationsTable.readAt));
    }

    const result = await db
      .select()
      .from(notificationsTable)
      .where(and(...conditions))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(limit)
      .offset(offset);

    return result as NotificationWithActor[];
  }

  /**
   * Count total notifications for a recipient
   * @param recipientId - The recipient's UUID
   * @returns Total number of notifications
   */
  async countForRecipient(recipientId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(notificationsTable)
      .where(eq(notificationsTable.recipientId, recipientId));
    return result[0]?.count || 0;
  }

  /**
   * Count unread notifications for a recipient
   * @param recipientId - The recipient's UUID
   * @returns Number of unread notifications
   */
  async countUnreadForRecipient(recipientId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(notificationsTable)
      .where(
        and(eq(notificationsTable.recipientId, recipientId), isNull(notificationsTable.readAt))
      );
    return result[0]?.count || 0;
  }

  /**
   * Mark a notification as read
   * @param notificationId - The notification's UUID
   * @param recipientId - The recipient's UUID (for authorization)
   * @returns The updated notification or null if not found
   */
  async markAsRead(notificationId: string, recipientId: string): Promise<Notification | null> {
    const result = await db
      .update(notificationsTable)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notificationsTable.id, notificationId),
          eq(notificationsTable.recipientId, recipientId)
        )
      )
      .returning();
    return result[0] || null;
  }

  /**
   * Mark all notifications as read for a recipient
   * @param recipientId - The recipient's UUID
   * @returns Number of notifications marked as read
   */
  async markAllAsRead(recipientId: string): Promise<number> {
    const result = await db
      .update(notificationsTable)
      .set({ readAt: new Date() })
      .where(
        and(eq(notificationsTable.recipientId, recipientId), isNull(notificationsTable.readAt))
      )
      .returning();
    return result.length;
  }

  /**
   * Delete a notification
   * @param notificationId - The notification's UUID
   * @param recipientId - The recipient's UUID (for authorization)
   * @returns The deleted notification or null if not found
   */
  async delete(notificationId: string, recipientId: string): Promise<Notification | null> {
    const result = await db
      .delete(notificationsTable)
      .where(
        and(
          eq(notificationsTable.id, notificationId),
          eq(notificationsTable.recipientId, recipientId)
        )
      )
      .returning();
    return result[0] || null;
  }
}

// Export a singleton instance for convenience
export const notificationRepository = new NotificationRepository();
