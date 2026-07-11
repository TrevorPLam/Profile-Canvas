import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import type { ReelPost, UserProfile } from '@/lib/types';

interface ReelStripProps {
  reels: ReelPost[];
  authors: Record<string, UserProfile>;
}

export function ReelStrip({ reels, authors }: ReelStripProps) {
  const colors = useColors();
  if (reels.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={[styles.header, { color: colors.foreground }]}>Reels</Text>
        <Pressable onPress={() => router.push('/(tabs)/reels')} hitSlop={8}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {reels.map((reel) => {
          const author = authors[reel.authorId];
          return (
            <Pressable
              key={reel.id}
              style={styles.card}
              onPress={() => router.push('/(tabs)/reels')}
            >
              <Image source={reel.thumbnail} style={styles.thumb} resizeMode="cover" />
              <View style={styles.overlay}>
                <Feather name="play" size={14} color="#FFFCF5" />
              </View>
              {author ? (
                <Text style={styles.caption} numberOfLines={2}>
                  {author.handle}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  header: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  seeAll: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  row: {
    gap: 10,
  },
  card: {
    width: 108,
    height: 172,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#151515',
    position: 'relative',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 999,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    color: '#FFFCF5',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
});
