import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { PostCard } from '@/components/PostCard';
import { ReelStrip } from '@/components/ReelStrip';
import { useSocialData } from '@/context/SocialDataContext';
import { useColors } from '@/hooks/useColors';
import type { Post, ReelPost } from '@/lib/types';

type FeedRow =
  | { kind: 'post'; post: Extract<Post, { kind: 'text' | 'video' }> }
  | { kind: 'reelStrip'; reels: ReelPost[] };

export default function FeedScreen() {
  const { me, posts, profiles, toggleLike } = useSocialData();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const rows = useMemo<FeedRow[]>(() => {
    const sorted = [...posts].sort((a, b) => b.createdAt - a.createdAt);
    const reelPool = sorted.filter((p): p is ReelPost => p.kind === 'reel');
    const nonReel = sorted.filter(
      (p): p is Extract<Post, { kind: 'text' | 'video' }> => p.kind !== 'reel',
    );

    const result: FeedRow[] = [];
    let reelIndex = 0;
    nonReel.forEach((post, i) => {
      result.push({ kind: 'post', post });
      if ((i + 1) % 4 === 0 && reelIndex < reelPool.length) {
        const chunk = reelPool.slice(reelIndex, reelIndex + 3);
        if (chunk.length > 0) {
          result.push({ kind: 'reelStrip', reels: chunk });
          reelIndex += chunk.length;
        }
      }
    });
    if (reelIndex < reelPool.length) {
      result.push({ kind: 'reelStrip', reels: reelPool.slice(reelIndex) });
    }
    return result;
  }, [posts]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.push('/(tabs)/profile')} hitSlop={8}>
          <Avatar name={me.name} color={me.avatarColor} size={34} />
        </Pressable>
        <Text style={[styles.brand, { color: colors.foreground }]}>Corkboard</Text>
        <Pressable onPress={() => router.push('/compose')} hitSlop={8} style={styles.composeBtn}>
          <Feather name="edit-3" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item, index) =>
          item.kind === 'post' ? item.post.id : `strip-${index}`
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        scrollEnabled={rows.length > 0}
        ListEmptyComponent={
          <EmptyState
            icon="inbox"
            title="Your feed is quiet"
            subtitle="Posts from you and your friends will show up here."
          />
        }
        renderItem={({ item }) => {
          if (item.kind === 'reelStrip') {
            return <ReelStrip reels={item.reels} authors={profiles} />;
          }
          const author = profiles[item.post.authorId];
          if (!author) return null;
          return <PostCard post={item.post} author={author} onToggleLike={toggleLike} />;
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  brand: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    letterSpacing: 0.2,
  },
  composeBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: 14,
    paddingBottom: 110,
    gap: 12,
  },
});
