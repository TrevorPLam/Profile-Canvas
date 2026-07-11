import React, { useMemo, useState } from 'react';
import {
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
import { useSocialData } from '@/context/SocialDataContext';
import { useColors } from '@/hooks/useColors';
import { timeAgo } from '@/lib/format';
import type { Comment } from '@/lib/types';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { posts, profiles, getProfile, getComments, addComment, deletePost, me } = useSocialData();
  const [draft, setDraft] = useState('');

  const post = useMemo(() => posts.find((p) => p.id === id), [posts, id]);
  const author = post ? profiles[post.authorId] : undefined;
  const comments = useMemo(() => (id ? getComments(id) : []), [id, getComments]);
  const originalAuthor = post?.repostOf ? getProfile(post.repostOf.originalAuthorId) : undefined;
  const isMine = post?.authorId === me.id;

  const submit = () => {
    if (!id || !draft.trim()) return;
    addComment(id, draft);
    setDraft('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const confirmDelete = () => {
    if (!post) return;
    Alert.alert(
      post.repostOf ? 'Undo repost?' : 'Delete post?',
      post.repostOf ? 'This will remove it from your profile and feed.' : 'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: post.repostOf ? 'Undo repost' : 'Delete',
          style: 'destructive',
          onPress: () => {
            deletePost(post.id);
            router.back();
          },
        },
      ]
    );
  };

  if (!post || !author) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Post' }} />
        <EmptyState icon="file-text" title="Post not found" />
      </View>
    );
  }

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
                    Reposted from {originalAuthor?.name ?? 'someone'}
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
            <CommentRow comment={item} authorProfile={profiles[item.authorId]} />
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
          <Avatar name={me.name} color={me.avatarColor} size={32} />
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
  authorProfile,
}: {
  comment: Comment;
  authorProfile?: { name: string; avatarColor: string };
}) {
  const colors = useColors();
  if (!authorProfile) return null;
  return (
    <View style={styles.commentRow}>
      <Avatar name={authorProfile.name} color={authorProfile.avatarColor} size={34} />
      <View style={styles.commentBody}>
        <Text style={[styles.commentName, { color: colors.foreground }]}>{authorProfile.name}</Text>
        <Text style={[styles.commentText, { color: colors.foreground }]}>{comment.text}</Text>
        <Text style={[styles.commentTime, { color: colors.mutedForeground }]}>
          {timeAgo(comment.createdAt)}
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
