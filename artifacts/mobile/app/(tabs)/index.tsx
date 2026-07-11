import React, { useMemo, useState } from 'react';
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

type FeedMode = 'friends' | 'recommended';

type FeedRow =
  | { kind: 'post'; post: Extract<Post, { kind: 'text' | 'video' }> }
  | { kind: 'reelStrip'; reels: ReelPost[] };

const MODE_OPTIONS: { id: FeedMode; label: string }[] = [
  { id: 'friends', label: 'Friends' },
  { id: 'recommended', label: 'Recommended' },
];

export default function FeedScreen() {
  const { me, posts, profiles, friendIds, requests, toggleLike } = useSocialData();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<FeedMode>('friends');

  const scopedPosts = useMemo(() => {
    if (mode === 'recommended') return posts;
    return posts.filter((p) => p.authorId === me.id || friendIds.includes(p.authorId));
  }, [posts, mode, me.id, friendIds]);

  const rows = useMemo<FeedRow[]>(() => {
    const sorted = [...scopedPosts].sort((a, b) => b.createdAt - a.createdAt);
    const reelPool = sorted.filter((p): p is ReelPost => p.kind === 'reel');
    const nonReel = sorted.filter(
      (p): p is Extract<Post, { kind: 'text' | 'video' }> => p.kind !== 'reel'
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
  }, [scopedPosts]);

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
    >
      <View style={styles.topBar}>
        <Pressable onPress={() => router.push('/(tabs)/profile')} hitSlop={8}>
          <Avatar name={me.name} color={me.avatarColor} size={34} />
        </Pressable>
        <Text style={[styles.brand, { color: colors.foreground }]}>Corkboard</Text>
        <Pressable
          onPress={() => router.push('/friends-list')}
          hitSlop={8}
          style={styles.friendsBtn}
        >
          <Feather name="users" size={22} color={colors.foreground} />
          {requests.length > 0 ? (
            <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
              <Text style={styles.badgeText}>{requests.length}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <View style={styles.modeRow}>
        {MODE_OPTIONS.map((opt) => {
          const active = mode === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => setMode(opt.id)}
              style={[
                styles.modeChip,
                { borderColor: colors.border },
                active && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.modeChipText,
                  { color: active ? '#FFFCF5' : colors.mutedForeground },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item, index) => (item.kind === 'post' ? item.post.id : `strip-${index}`)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        scrollEnabled={rows.length > 0}
        ListEmptyComponent={
          mode === 'friends' ? (
            <EmptyState
              icon="users"
              title="No posts from friends yet"
              subtitle="Add friends from the people icon above, or switch to Recommended to see more."
            />
          ) : (
            <EmptyState icon="inbox" title="Nothing to show" />
          )
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
  friendsBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFCF5',
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  modeChip: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  modeChipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  list: {
    paddingHorizontal: 14,
    paddingBottom: 110,
    gap: 12,
  },
});
