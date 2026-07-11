import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { useNotificationsContext } from '@/context/NotificationsContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useColors } from '@/hooks/useColors';
import { timeAgo } from '@/lib/format';

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { markAsRead, markAllAsRead } = useNotificationsContext();
  const { data: notificationsData, isLoading } = useNotifications(false, 50);

  const notifications = notificationsData?.notifications || [];

  const handlePressNotification = (notificationId: string) => {
    markAsRead(notificationId);
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: 'Notifications',
          headerRight: () =>
            notifications.length > 0 ? (
              <Pressable onPress={handleMarkAllRead} hitSlop={8}>
                <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all read</Text>
              </Pressable>
            ) : null,
        }}
      />

      {isLoading ? (
        <View style={[styles.loading, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.background }]}>
          <EmptyState icon="bell" title="No notifications" subtitle="You're all caught up!" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.notification.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onPress={() => handlePressNotification(item.notification.id)}
            />
          )}
        />
      )}
    </View>
  );
}

function NotificationItem({
  notification,
  onPress,
}: {
  notification: {
    notification: { id: string; type: string; readAt: string | null; createdAt: string };
    actor: { name: string; handle: string; avatarUrl: string | null };
    post: { id: string; kind: string; text: string | null; title: string | null } | null;
  };
  onPress: () => void;
}) {
  const colors = useColors();
  const { type, readAt, createdAt } = notification.notification;
  const { name, avatarUrl } = notification.actor;
  const post = notification.post;

  const isUnread = !readAt;

  const getNotificationText = () => {
    switch (type) {
      case 'like':
        return 'liked your post';
      case 'comment':
        return 'commented on your post';
      case 'friendRequest':
        return 'sent you a friend request';
      case 'friendAccepted':
        return 'accepted your friend request';
      case 'repost':
        return 'reposted your post';
      case 'save':
        return 'saved your post';
      default:
        return 'interacted with you';
    }
  };

  const getPostPreview = () => {
    if (!post) return null;
    if (post.kind === 'text' && post.text) {
      return post.text.length > 50 ? post.text.slice(0, 50) + '...' : post.text;
    }
    if (post.kind === 'video' && post.title) {
      return post.title;
    }
    return null;
  };

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.item,
        { backgroundColor: colors.card, borderColor: colors.border },
        isUnread && { backgroundColor: colors.card + 'CC' },
      ]}
    >
      <Avatar name={name} color="#6366f1" avatarUrl={avatarUrl} size={44} />
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={[styles.actorName, { color: colors.foreground }]}>{name}</Text>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {timeAgo(new Date(createdAt).getTime())}
          </Text>
        </View>
        <Text style={[styles.actionText, { color: colors.foreground }]}>
          {getNotificationText()}
        </Text>
        {getPostPreview() ? (
          <Text style={[styles.postPreview, { color: colors.mutedForeground }]}>
            "{getPostPreview()}"
          </Text>
        ) : null}
      </View>
      {isUnread && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  itemContent: {
    flex: 1,
    gap: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actorName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  time: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  actionText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  postPreview: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    fontStyle: 'italic',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  markAllText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
});
