import React, { useMemo } from 'react';
import { Dimensions, FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { ReelCard } from '@/components/ReelCard';
import { useSocialData } from '@/context/SocialDataContext';
import type { ReelPost } from '@/lib/types';

const { height: screenHeight } = Dimensions.get('window');

export default function ReelsScreen() {
  const { posts, profiles, toggleLike } = useSocialData();
  const insets = useSafeAreaInsets();
  const cardHeight = screenHeight;

  const reels = useMemo<ReelPost[]>(
    () =>
      [...posts]
        .filter((p): p is ReelPost => p.kind === 'reel')
        .sort((a, b) => b.createdAt - a.createdAt),
    [posts],
  );

  if (reels.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <EmptyState icon="film" title="No reels yet" subtitle="Short vertical videos will appear here." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reels}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={cardHeight}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({ length: cardHeight, offset: cardHeight * index, index })}
        renderItem={({ item }) => {
          const author = profiles[item.authorId];
          if (!author) return null;
          return (
            <ReelCard post={item} author={author} onToggleLike={toggleLike} height={cardHeight} />
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
