import React from 'react';
import { Alert, Image, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { useSocialData } from '@/context/SocialDataContext';
import { useColors } from '@/hooks/useColors';
import { timeAgo } from '@/lib/format';
import type { Post, UserProfile } from '@/lib/types';

interface PostCardProps {
  post: Extract<Post, { kind: 'text' | 'video' }>;
  author: UserProfile;
  onToggleLike: (id: string) => void;
}

export function PostCard({ post, author, onToggleLike }: PostCardProps) {
  const colors = useColors();
  const { me, getProfile, repostPost, hasRepostedByMe, deletePost } = useSocialData();

  const openAuthor = () => {
    if (author.id === 'me') {
      router.push('/(tabs)/profile');
    } else {
      router.push(`/profile/${author.id}`);
    }
  };

  const openDetail = () => {
    router.push(`/post/${post.id}`);
  };

  const like = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onToggleLike(post.id);
  };

  const reposted = hasRepostedByMe(post.id);

  const repost = () => {
    if (reposted) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    repostPost(post.id);
  };

  const share = () => {
    const summary = post.kind === 'text' ? post.text : post.title;
    Share.share({ message: `${author.name}: ${summary}` }).catch(() => {});
  };

  const originalAuthor = post.repostOf ? getProfile(post.repostOf.originalAuthorId) : undefined;
  const isMine = post.authorId === me.id;

  const confirmDelete = () => {
    Alert.alert(
      post.repostOf ? 'Undo repost?' : 'Delete post?',
      post.repostOf
        ? 'This will remove it from your profile and feed.'
        : 'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: post.repostOf ? 'Undo repost' : 'Delete',
          style: 'destructive',
          onPress: () => deletePost(post.id),
        },
      ],
    );
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {post.repostOf ? (
        <View style={styles.repostBanner}>
          <Feather name="repeat" size={12} color={colors.mutedForeground} />
          <Text style={[styles.repostBannerText, { color: colors.mutedForeground }]}>
            Reposted from {originalAuthor?.name ?? 'someone'}
          </Text>
        </View>
      ) : null}
      <Pressable style={styles.header} onPress={openAuthor} hitSlop={6}>
        <Avatar name={author.name} color={author.avatarColor} size={40} />
        <View style={styles.headerText}>
          <Text style={[styles.name, { color: colors.foreground }]}>{author.name}</Text>
          <Text style={[styles.handle, { color: colors.mutedForeground }]}>
            {author.handle} · {timeAgo(post.createdAt)}
          </Text>
        </View>
      </Pressable>

      <Pressable onPress={openDetail}>
        {post.kind === 'text' ? (
          <Text style={[styles.text, { color: colors.foreground }]}>{post.text}</Text>
        ) : (
          <View style={styles.videoWrap}>
            <Image source={post.thumbnail} style={styles.thumbnail} resizeMode="cover" />
            <View style={styles.playOverlay}>
              <View style={styles.playCircle}>
                <Feather name="play" size={20} color="#FFFCF5" />
              </View>
            </View>
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{post.durationLabel}</Text>
            </View>
            <Text style={[styles.videoTitle, { color: colors.foreground }]}>{post.title}</Text>
            <Text style={[styles.videoMeta, { color: colors.mutedForeground }]}>
              {post.viewsLabel}
            </Text>
          </View>
        )}
      </Pressable>

      <View style={styles.actions}>
        <Pressable style={styles.actionBtn} onPress={like} hitSlop={8}>
          <Feather
            name="heart"
            size={17}
            color={post.likedByMe ? colors.destructive : colors.mutedForeground}
            style={post.likedByMe ? styles.filledHeart : undefined}
          />
          <Text
            style={[
              styles.actionText,
              { color: post.likedByMe ? colors.destructive : colors.mutedForeground },
            ]}
          >
            {post.likeCount}
          </Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={openDetail} hitSlop={8}>
          <Feather name="message-circle" size={17} color={colors.mutedForeground} />
          <Text style={[styles.actionText, { color: colors.mutedForeground }]}>
            {post.commentCount}
          </Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={repost} hitSlop={8} disabled={reposted}>
          <Feather name="repeat" size={17} color={reposted ? colors.primary : colors.mutedForeground} />
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={share} hitSlop={8}>
          <Feather name="share" size={17} color={colors.mutedForeground} />
        </Pressable>
        {isMine ? (
          <Pressable style={styles.deleteBtn} onPress={confirmDelete} hitSlop={8}>
            <Feather name="trash-2" size={16} color={colors.mutedForeground} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
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
    fontSize: 15,
    lineHeight: 21,
  },
  videoWrap: {
    gap: 6,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    aspectRatio: 16 / 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    right: 8,
    bottom: 44,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#FFFCF5',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  videoTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    lineHeight: 19,
    marginTop: 2,
  },
  videoMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  repostBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: -2,
  },
  repostBannerText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 22,
    marginTop: 2,
  },
  deleteBtn: {
    marginLeft: 'auto',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  filledHeart: {
    transform: [{ scale: 1.05 }],
  },
});
