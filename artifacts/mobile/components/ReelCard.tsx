import React from 'react';
import { Image, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { useSocialData } from '@/context/SocialDataContext';
import type { ReelPost, UserProfile } from '@/lib/types';

interface ReelCardProps {
  post: ReelPost;
  author: UserProfile;
  onToggleLike: (id: string) => void;
  height: number;
}

export function ReelCard({ post, author, onToggleLike, height }: ReelCardProps) {
  const { getProfile, repostPost, hasRepostedByMe } = useSocialData();

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
    Share.share({ message: `${author.name}: ${post.caption}` }).catch(() => {});
  };

  const originalAuthor = post.repostOf ? getProfile(post.repostOf.originalAuthorId) : undefined;

  return (
    <View style={[styles.wrap, { height }]}>
      <Pressable style={styles.imagePress} onPress={openDetail}>
        <Image source={post.thumbnail} style={styles.image} resizeMode="cover" />
      </Pressable>
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.75)']}
        style={styles.overlay}
        start={{ x: 0, y: 0.4 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.bottomRow}>
          <View style={styles.info}>
            {post.repostOf ? (
              <View style={styles.repostRow}>
                <Feather name="repeat" size={12} color="#FFFCF5" />
                <Text style={styles.repostText}>Reposted from {originalAuthor?.name ?? 'someone'}</Text>
              </View>
            ) : null}
            <Pressable style={styles.authorRow} onPress={openAuthor} hitSlop={6}>
              <Avatar name={author.name} color={author.avatarColor} size={32} ringColor="#FFFCF5" />
              <Text style={styles.authorName}>{author.handle}</Text>
            </Pressable>
            <Text style={styles.caption}>{post.caption}</Text>
            <View style={styles.soundRow}>
              <Feather name="music" size={12} color="#FFFCF5" />
              <Text style={styles.sound}>{post.soundLabel}</Text>
            </View>
          </View>
          <View style={styles.rail}>
            <Pressable style={styles.railBtn} onPress={like} hitSlop={8}>
              <Feather
                name="heart"
                size={26}
                color={post.likedByMe ? '#FF3D7F' : '#FFFCF5'}
              />
              <Text style={styles.railText}>{post.likeCount}</Text>
            </Pressable>
            <Pressable style={styles.railBtn} onPress={openDetail} hitSlop={8}>
              <Feather name="message-circle" size={24} color="#FFFCF5" />
              <Text style={styles.railText}>{post.commentCount}</Text>
            </Pressable>
            <Pressable style={styles.railBtn} onPress={repost} hitSlop={8} disabled={reposted}>
              <Feather name="repeat" size={23} color={reposted ? '#FF3D7F' : '#FFFCF5'} />
            </Pressable>
            <Pressable style={styles.railBtn} onPress={share} hitSlop={8}>
              <Feather name="share" size={23} color="#FFFCF5" />
            </Pressable>
            <View style={styles.railBtn}>
              <Feather name="eye" size={22} color="#FFFCF5" />
              <Text style={styles.railText}>{post.viewsLabel}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#151515',
  },
  imagePress: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  repostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  repostText: {
    color: '#FFFCF5',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
    justifyContent: 'flex-end',
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  info: {
    flex: 1,
    gap: 8,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorName: {
    color: '#FFFCF5',
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  caption: {
    color: '#FFFCF5',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 19,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sound: {
    color: '#FFFCF5',
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  rail: {
    alignItems: 'center',
    gap: 18,
  },
  railBtn: {
    alignItems: 'center',
    gap: 3,
  },
  railText: {
    color: '#FFFCF5',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
});
