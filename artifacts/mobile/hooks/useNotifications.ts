import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export interface Notification {
  id: string;
  recipientId: string;
  actorId: string;
  type: 'like' | 'comment' | 'friendRequest' | 'friendAccepted' | 'repost' | 'save';
  postId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationResponse {
  notification: Notification;
  actor: {
    userId: string;
    handle: string;
    name: string;
    avatarUrl: string | null;
  };
  post: {
    id: string;
    authorId: string;
    kind: 'text' | 'video' | 'reel';
    text: string | null;
    title: string | null;
    caption: string | null;
    thumbnailUrl: string | null;
    createdAt: string;
  } | null;
}

export interface NotificationListResponse {
  notifications: NotificationResponse[];
  total: number;
  unreadCount: number;
  limit: number;
  offset: number;
}

const NOTIFICATIONS_QUERY_KEY = ['notifications'];
const UNREAD_COUNT_QUERY_KEY = ['unreadCount'];

export function useNotifications(unreadOnly = false, limit = 20, offset = 0) {
  return useQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, { unreadOnly, limit, offset }],
    queryFn: async () => {
      const params = new URLSearchParams({
        unreadOnly: unreadOnly.toString(),
        limit: limit.toString(),
        offset: offset.toString(),
      });
      const response = await apiFetch<NotificationListResponse>(
        `/notifications?${params.toString()}`
      );
      return response;
    },
    staleTime: 30000, // 30 seconds
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: UNREAD_COUNT_QUERY_KEY,
    queryFn: async () => {
      const response = await apiFetch<NotificationListResponse>(
        '/notifications?unreadOnly=true&limit=1'
      );
      return response.unreadCount;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Poll every minute for unread count
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await apiFetch(`/notifications/${notificationId}`, {
        method: 'PATCH',
      });
    },
    onSuccess: () => {
      // Invalidate notifications and unread count queries
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiFetch('/notifications', {
        method: 'PATCH',
      });
    },
    onSuccess: () => {
      // Invalidate notifications and unread count queries
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY });
    },
  });
}
