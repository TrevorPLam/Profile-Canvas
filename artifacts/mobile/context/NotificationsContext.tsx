import React, { createContext, useContext } from 'react';
import { useUnreadCount, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';

interface NotificationsContextValue {
  unreadCount: number | undefined;
  isLoadingUnread: boolean;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(
  undefined
);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { data: unreadCount, isLoading: isLoadingUnread } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const value: NotificationsContextValue = {
    unreadCount,
    isLoadingUnread,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotificationsContext must be used within NotificationsProvider');
  }
  return ctx;
}
