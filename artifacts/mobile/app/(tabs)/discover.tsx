import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { useColors } from '@/hooks/useColors';
import { useDiscover } from '@/hooks/useDiscover';
import { useTrending } from '@/hooks/useTrending';
import { TOPICS, getTopic } from '@/lib/topics';

export default function DiscoverScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  const isFiltering = Boolean(query.trim() || activeTopic);

  // Use trending when no filters, use discover when filtering
  const trending = useTrending();
  const discover = useDiscover(query, activeTopic);

  const posts = isFiltering ? discover.posts : trending.posts;
  const profiles = isFiltering ? discover.profiles : trending.profiles;
  const isLoading = isFiltering ? discover.isLoading : trending.isLoading;
  const error = isFiltering ? discover.error : trending.error;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Discover</Text>

        <View style={[styles.searchBar, { backgroundColor: colors.secondary }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search topics, posts, and creators"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
            autoCapitalize="none"
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {TOPICS.map((topic) => {
            const active = activeTopic === topic.id;
            return (
              <Pressable
                key={topic.id}
                onPress={() => setActiveTopic(active ? null : topic.id)}
                style={[
                  styles.chip,
                  { borderColor: colors.border },
                  active && { backgroundColor: topic.color, borderColor: topic.color },
                ]}
              >
                <Feather
                  name={topic.icon as never}
                  size={13}
                  color={active ? '#FFFCF5' : colors.mutedForeground}
                />
                <Text style={[styles.chipText, { color: active ? '#FFFCF5' : colors.foreground }]}>
                  {topic.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {isFiltering ? `Results (${posts.length})` : 'Trending now'}
        </Text>

        {isLoading ? (
          <View style={styles.centerContainer}>
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading...</Text>
          </View>
        ) : error ? (
          <EmptyState
            icon="alert-circle"
            title="Something went wrong"
            subtitle="Failed to load posts. Please try again."
          />
        ) : posts.length === 0 ? (
          <EmptyState
            icon="compass"
            title="Nothing here yet"
            subtitle="Try a different topic or search term."
          />
        ) : (
          <View style={styles.grid}>
            {posts.map((post) => {
              const author = profiles[post.authorId];
              if (!author) return null;
              const primaryTopic = getTopic(post.topics[0] ?? '') ?? TOPICS[TOPICS.length - 1]!;
              const hasMedia = post.kind === 'video' || post.kind === 'reel';
              return (
                <Pressable
                  key={post.id}
                  style={styles.tile}
                  onPress={() => router.push(`/post/${post.id}` as Href)}
                >
                  {hasMedia ? (
                    <>
                      <Image source={post.thumbnail} style={styles.tileImage} resizeMode="cover" />
                      <View style={styles.tileOverlay}>
                        <Feather
                          name={post.kind === 'reel' ? 'play' : 'film'}
                          size={13}
                          color="#FFFCF5"
                        />
                        <Text style={styles.tileOverlayText} numberOfLines={1}>
                          {post.viewsLabel}
                        </Text>
                      </View>
                      <Text style={styles.tileMediaCaption} numberOfLines={2}>
                        {post.kind === 'video' ? post.title : post.caption}
                      </Text>
                    </>
                  ) : (
                    <View style={[styles.tileText, { backgroundColor: primaryTopic.color }]}>
                      <Feather
                        name={primaryTopic.icon as never}
                        size={16}
                        color="rgba(255,252,245,0.7)"
                      />
                      <Text style={styles.tileTextBody} numberOfLines={5}>
                        {post.text}
                      </Text>
                    </View>
                  )}
                  <View style={styles.tileFooter}>
                    <Text
                      style={[styles.tileAuthor, { color: colors.mutedForeground }]}
                      numberOfLines={1}
                    >
                      {author.name}
                    </Text>
                    <View style={styles.tileLikes}>
                      <Feather name="heart" size={11} color={colors.mutedForeground} />
                      <Text style={[styles.tileLikesText, { color: colors.mutedForeground }]}>
                        {post.likeCount}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 18,
    paddingBottom: 140,
    gap: 14,
  },
  pageTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  chipRow: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tile: {
    width: '47%',
    borderRadius: 16,
    overflow: 'hidden',
    gap: 6,
  },
  tileImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
  },
  tileOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tileOverlayText: {
    color: '#FFFCF5',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  tileMediaCaption: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#7A6E63',
    paddingHorizontal: 2,
  },
  tileText: {
    aspectRatio: 1,
    borderRadius: 16,
    padding: 12,
    justifyContent: 'space-between',
  },
  tileTextBody: {
    color: '#FFFCF5',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
  },
  tileFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  tileAuthor: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  tileLikes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  tileLikesText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
});
