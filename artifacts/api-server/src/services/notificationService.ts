import { NotificationRepository, type Notification, type InsertNotification } from '@workspace/db';
import { ProfileRepository } from '@workspace/db';
import { PostRepository } from '@workspace/db';
import { EventEmitter } from 'events';

export interface CreateNotificationInput {
  recipientId: string;
  actorId: string;
  type: 'like' | 'comment' | 'friendRequest' | 'friendAccepted' | 'repost' | 'save';
  postId?: string;
}

export interface NotificationWithDetails extends Notification {
  actorProfile?: {
    userId: string;
    handle: string;
    name: string;
    avatarUrl: string | null;
  };
  post?: {
    id: string;
    authorId: string;
    kind: string;
    text: string | null;
    title: string | null;
    caption: string | null;
    thumbnailUrl: string | null;
  };
}

/**
 * NotificationService encapsulates notification business logic and real-time delivery.
 * 
 * Deep module: Hides SSE event management, profile loading, and notification creation
 * behind a simple interface of domain operations.
 */
export class NotificationService extends EventEmitter {
  private notificationRepo: NotificationRepository;
  private profileRepo: ProfileRepository;
  private postRepo: PostRepository;

  constructor() {
    super();
    this.notificationRepo = new NotificationRepository();
    this.profileRepo = new ProfileRepository();
    this.postRepo = new PostRepository();
  }

  /**
   * Create a notification and emit real-time event
   * Does not notify users about their own actions
   * @param input - Notification data
   * @returns The created notification or null if actor is recipient
   */
  async create(input: CreateNotificationInput): Promise<Notification | null> {
    // Don't notify users about their own actions
    if (input.actorId === input.recipientId) {
      return null;
    }

    const notification: InsertNotification = {
      recipientId: input.recipientId,
      actorId: input.actorId,
      type: input.type,
      postId: input.postId || null,
    };

    const created = await this.notificationRepo.create(notification);

    // Emit real-time event to connected clients
    this.emit('notification', created);

    return created;
  }

  /**
   * List notifications for a recipient with details
   * @param recipientId - The recipient's UUID
   * @param unreadOnly - If true, only return unread notifications
   * @param limit - Maximum number of notifications to return
   * @param offset - Number of notifications to skip
   * @returns List of notifications with actor and post details
   */
  async listForRecipient(
    recipientId: string,
    unreadOnly: boolean = false,
    limit: number = 50,
    offset: number = 0
  ): Promise<NotificationWithDetails[]> {
    const notifications = await this.notificationRepo.listForRecipient(
      recipientId,
      unreadOnly,
      limit,
      offset
    );

    // Load actor profiles and posts in parallel
    const enriched = await Promise.all(
      notifications.map(async (notification) => {
        const [actorProfile, post] = await Promise.all([
          this.profileRepo.getByUserId(notification.actorId),
          notification.postId ? this.postRepo.getById(notification.postId) : Promise.resolve(null),
        ]);

        return {
          ...notification,
          actorProfile: actorProfile
            ? {
                userId: actorProfile.userId,
                handle: actorProfile.handle,
                name: actorProfile.name,
                avatarUrl: actorProfile.avatarUrl,
              }
            : undefined,
          post: post
            ? {
                id: post.id,
                authorId: post.authorId,
                kind: post.kind,
                text: post.content.kind === 'text' ? post.content.text : null,
                title: post.content.kind === 'video' ? post.content.title : null,
                caption: post.content.kind === 'reel' ? post.content.caption : null,
                thumbnailUrl:
                  post.content.kind === 'video' || post.content.kind === 'reel'
                    ? post.content.thumbnailUrl
                    : null,
              }
            : undefined,
        };
      })
    );

    return enriched;
  }

  /**
   * Count total notifications for a recipient
   * @param recipientId - The recipient's UUID
   * @returns Total number of notifications
   */
  async countForRecipient(recipientId: string): Promise<number> {
    return this.notificationRepo.countForRecipient(recipientId);
  }

  /**
   * Count unread notifications for a recipient
   * @param recipientId - The recipient's UUID
   * @returns Number of unread notifications
   */
  async countUnreadForRecipient(recipientId: string): Promise<number> {
    return this.notificationRepo.countUnreadForRecipient(recipientId);
  }

  /**
   * Mark a notification as read
   * @param notificationId - The notification's UUID
   * @param recipientId - The recipient's UUID (for authorization)
   * @returns The updated notification or null if not found
   */
  async markAsRead(notificationId: string, recipientId: string): Promise<Notification | null> {
    return this.notificationRepo.markAsRead(notificationId, recipientId);
  }

  /**
   * Mark all notifications as read for a recipient
   * @param recipientId - The recipient's UUID
   * @returns Number of notifications marked as read
   */
  async markAllAsRead(recipientId: string): Promise<number> {
    const count = await this.notificationRepo.markAllAsRead(recipientId);
    
    // Emit event to update connected clients
    this.emit('notifications-read', { recipientId, count });
    
    return count;
  }

  /**
   * Delete a notification
   * @param notificationId - The notification's UUID
   * @param recipientId - The recipient's UUID (for authorization)
   * @returns The deleted notification or null if not found
   */
  async delete(notificationId: string, recipientId: string): Promise<Notification | null> {
    return this.notificationRepo.delete(notificationId, recipientId);
  }
}

// Export a singleton instance for convenience
export const notificationService = new NotificationService();
