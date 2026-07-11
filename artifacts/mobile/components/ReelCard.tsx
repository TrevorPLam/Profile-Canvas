import React from 'react';
import { Alert, Image, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useEngagement } from '@/hooks/useEngagement';

interface ReelAuthor {
  id: string;
  handle: string;
  name: string;
  avatarUrl: string | null;
  accentColor: string;
}

interface ReelPost {
  id: string;
  authorId: string;
  kind: 'reel';
  caption: string;
  thumbnailUrl: string;
  soundLabel: string;
  viewsLabel: string;
  createdAt: number;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  repostOf?: {
    originalPostId: string;
    originalAuthorId: string;
  };
  author: ReelAuthor;
}

interface ReelCardProps {
  post: ReelPost;
  author: ReelAuthor;
  height: number;
}

export function ReelCard({ post, author, height }: ReelCardProps) {
  const { user } = useAuth();
  const { toggleLike, repost, isLiking, isReposting } = useEngagement(post.id);
  const player = useVideoPlayer(post.thumbnailUrl, (player: any) => {
    player.loop = true;
    player.play();
  });

  const openAuthor = () => {
    if (author.id === user?.userId) {
      router.push('/(tabs)/profile');
    } else {
      router.push(`/profile/${author.id}`);
    }
  };

  const openDetail = () => {
    router.push(`/post/${post.id}`);
  };

  const like = () => {
    if (isLiking) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    toggleLike();
  };

  const handleRepost = () => {
    if (isReposting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    repost();
  };

  const share = () => {
    Share.share({ message: `${author.name}: ${post.caption}` }).catch(() => {});
  };

  const isMine = post.authorId === user?.userId;

  const confirmDelete = () => {
    Alert.alert(
      post.repostOf ? 'Undo repost?' : 'Delete reel?',
      post.repostOf ? 'This will remove it from your profile and reels.' : 'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: post.repostOf ? 'Undo repost' : 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement delete API call
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.wrap, { height }]}>
      <Pressable style={styles.videoPress} onPress={openDetail}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="cover"
          allowsFullscreen
          allowsPictureInPicture
        />
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
                <Text style={styles.repostText}>Reposted</Text>
              </View>
            ) : null}
            <Pressable style={styles.authorRow} onPress={openAuthor} hitSlop={6}>
              <Avatar name={author.name} color={author.accentColor} size={32} ringColor="#FFFCF5" />
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
              <Feather name="heart" size={26} color={post.likedByMe ? '#FF3D7F' : '#FFFCF5'} />
              <Text style={styles.railText}>{post.likeCount}</Text>
            </Pressable>
            <Pressable style={styles.railBtn} onPress={openDetail} hitSlop={8}>
              <Feather name="message-circle" size={24} color="#FFFCF5" />
              <Text style={styles.railText}>{post.commentCount}</Text>
            </Pressable>
            <Pressable style={styles.railBtn} onPress={handleRepost} hitSlop={8}>
              <Feather name="repeat" size={23} color="#FFFCF5" />
            </Pressable>
            <Pressable style={styles.railBtn} onPress={share} hitSlop={8}>
              <Feather name="share" size={23} color="#FFFCF5" />
            </Pressable>
            <View style={styles.railBtn}>
              <Feather name="eye" size={22} color="#FFFCF5" />
              <Text style={styles.railText}>{post.viewsLabel}</Text>
            </View>
            {isMine ? (
              <Pressable style={styles.railBtn} onPress={confirmDelete} hitSlop={8}>
                <Feather name="trash-2" size={21} color="#FFFCF5" />
              </Pressable>
            ) : null}
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
  videoPress: {
    width: '100%',
    height: '100%',
  },
  video: {
    width: '100%',
    height: '100%',
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
