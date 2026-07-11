import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { useComments } from '@/hooks/useComments';
import { useCreateComment } from '@/hooks/useCreateComment';
import { useDeletePost } from '@/hooks/useDeletePost';
import { usePost } from '@/hooks/usePost';
import { timeAgo } from '@/lib/format';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const deletePost = useDeletePost();
  const [draft, setDraft] = useState('');

  // Use backend API hooks for comments
  const { comments } = useComments(id);
  const { createComment } = useCreateComment();
  const { data: post, isLoading: postLoading } = usePost(id);

  const submit = async () => {
    if (!id || !draft.trim()) return;
    try {
      await createComment({ postId: id, text: draft });
      setDraft('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  const confirmDelete = () => {
    if (!post) return;
    Alert.alert(
      'Delete post?',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deletePost.mutate(post.id);
            router.back();
          },
        },
      ]
    );
  };

  if (postLoading) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Post' }} />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Post' }} />
        <EmptyState icon="file-text" title="Post not found" />
      </View>
    );
  }

  const isMine = user ? post.authorId === user.userId : false;
  const author = { name: 'User', handle: 'user', avatarColor: '#6366f1' }; // Placeholder

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: 'Post',
          headerLeft: () => (
            <Feather
              name="chevron-left"
              size={24}
              color={colors.foreground}
              onPress={() => router.back()}
              style={{ marginRight: 8 }}
            />
          ),
          headerRight: isMine
            ? () => (
                <Feather
                  name="trash-2"
                  size={20}
                  color={colors.mutedForeground}
                  onPress={confirmDelete}
                />
              )
            : undefined,
        }}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              {post.repostOf ? (
                <View style={styles.repostBanner}>
                  <Feather name="repeat" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.repostBannerText, { color: colors.mutedForeground }]}>
                    Reposted
                  </Text>
                </View>
              ) : null}
              <View style={styles.header}>
                <Avatar name={author.name} color={author.avatarColor} size={44} />
                <View style={styles.headerText}>
                  <Text style={[styles.name, { color: colors.foreground }]}>{author.name}</Text>
                  <Text style={[styles.handle, { color: colors.mutedForeground }]}>
                    {author.handle} · {timeAgo(post.createdAt)}
                  </Text>
                </View>
              </View>

              {post.kind === 'text' ? (
                <Text style={[styles.text, { color: colors.foreground }]}>{post.text}</Text>
              ) : (
                <View style={styles.mediaWrap}>
                  <Image source={post.thumbnail} style={styles.thumbnail} resizeMode="cover" />
                  <Text style={[styles.mediaTitle, { color: colors.foreground }]}>
                    {post.kind === 'video' ? post.title : post.caption}
                  </Text>
                  <Text style={[styles.mediaMeta, { color: colors.mutedForeground }]}>
                    {post.kind === 'video'
                      ? `${post.durationLabel} · ${post.viewsLabel}`
                      : `${post.soundLabel} · ${post.viewsLabel} views`}
                  </Text>
                </View>
              )}

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Feather name="heart" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.statText, { color: colors.mutedForeground }]}>
                    {post.likeCount} likes
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Feather name="message-circle" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.statText, { color: colors.mutedForeground }]}>
                    {post.commentCount} comments
                  </Text>
                </View>
              </View>

              <Text style={[styles.commentsTitle, { color: colors.foreground }]}>Comments</Text>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="message-circle"
              title="No comments yet"
              subtitle="Be the first to reply."
            />
          }
          renderItem={({ item }) => (
            <CommentRow comment={item} />
          )}
        />

        <View
          style={[
            styles.composeRow,
            {
              borderTopColor: colors.border,
              backgroundColor: colors.card,
              paddingBottom: insets.bottom + 10,
            },
          ]}
        >
          <Avatar name={user?.name || 'User'} color={user ? '#6366f1' : '#6366f1'} size={32} />
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Write a comment…"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground }]}
            multiline
          />
          <Pressable
            onPress={submit}
            disabled={!draft.trim()}
            style={[
              styles.sendBtn,
              { backgroundColor: draft.trim() ? colors.primary : colors.secondary },
            ]}
          >
            <Feather
              name="arrow-up"
              size={16}
              color={draft.trim() ? '#FFFCF5' : colors.mutedForeground}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function CommentRow({
  comment,
}: {
  comment: {
    id: string;
    postId: string;
    author: {
      userId: string;
      handle: string;
      name: string;
      avatarUrl: string | null;
    };
    text: string;
    createdAt: string;
  };
}) {
  const colors = useColors();
  // Use avatarUrl from API response, fallback to generated color if null
  const avatarColor = comment.author.avatarUrl ? '#3B82F6' : '#3B82F6';
  // Convert ISO date string to timestamp for timeAgo
  const timestamp = new Date(comment.createdAt).getTime();
  return (
    <View style={styles.commentRow}>
      <Avatar
        name={comment.author.name}
        color={avatarColor}
        avatarUrl={comment.author.avatarUrl}
        size={34}
      />
      <View style={styles.commentBody}>
        <Text style={[styles.commentName, { color: colors.foreground }]}>{comment.author.name}</Text>
        <Text style={[styles.commentText, { color: colors.foreground }]}>{comment.text}</Text>
        <Text style={[styles.commentTime, { color: colors.mutedForeground }]}>
          {timeAgo(timestamp)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  notFound: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 14,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    marginTop: 12,
    marginBottom: 6,
  },
  repostBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  repostBannerText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  handle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 1,
  },
  text: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 22,
  },
  mediaWrap: {
    gap: 6,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
  },
  mediaTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    lineHeight: 20,
    marginTop: 2,
  },
  mediaMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  commentsTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    marginTop: 8,
  },
  commentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  commentBody: {
    flex: 1,
    gap: 2,
  },
  commentName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  commentText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 19,
  },
  commentTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: 1,
  },
  composeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    maxHeight: 90,
    paddingVertical: 6,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
