import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { PinnedCard } from '@/components/PinnedCard';
import { PostCard } from '@/components/PostCard';
import { ProfileHeader } from '@/components/ProfileHeader';
import { TopFriendsGrid } from '@/components/TopFriendsGrid';
import { useMyProfile } from '@/hooks/useProfile';
import { useColors } from '@/hooks/useColors';
import { MODULE_LABELS } from '@/lib/theme';
import { visibleModulesFor } from '@/lib/modules';
import type { Post, UserProfile } from '@/lib/types';

export default function MyProfileScreen() {
  const colors = useColors();
  const { data: me, isLoading: profileLoading, error: profileError } = useMyProfile();

  if (profileLoading && !me) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (profileError && !me) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.foreground }]}>
          Failed to load profile
        </Text>
      </View>
    );
  }

  if (!me) {
    return null;
  }

  const displayMe = me;

  // Posts will be fetched from API in a future task
  const myPosts: Extract<Post, { kind: 'text' | 'video' }>[] = [];

  // Top friends will be fetched from API in a future task
  const topFriends: UserProfile[] = [];

  const modules = visibleModulesFor(displayMe, true, false);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ProfileHeader
        profile={displayMe}
        friendCount={displayMe.friendCount}
        postCount={myPosts.length}
        isMe
        isFriend={false}
        onEdit={() => router.push('/edit-profile')}
        onPressFriends={() => router.push('/friends-list')}
      />

      <View style={styles.body}>
        {modules.map((module) => {
          if (module.id === 'about') {
            return (
              <PinnedCard key={module.id} title={MODULE_LABELS.about} accentColor={displayMe.accentColor}>
                <Text style={[styles.bio, { color: colors.foreground }]}>{displayMe.bio}</Text>
              </PinnedCard>
            );
          }
          if (module.id === 'mood' && (displayMe.moodLabel || displayMe.nowPlaying)) {
            return (
              <PinnedCard key={module.id} title={MODULE_LABELS.mood} accentColor={displayMe.accentColor}>
                <View style={styles.moodRows}>
                  {displayMe.moodLabel ? (
                    <View style={styles.moodRow}>
                      <Feather
                        name={(displayMe.moodIcon as never) ?? 'smile'}
                        size={15}
                        color={colors.mutedForeground}
                      />
                      <Text style={[styles.moodText, { color: colors.foreground }]}>
                        Feeling {displayMe.moodLabel.toLowerCase()}
                      </Text>
                    </View>
                  ) : null}
                  {displayMe.nowPlaying ? (
                    <View style={styles.moodRow}>
                      <Feather name="music" size={15} color={colors.mutedForeground} />
                      <Text style={[styles.moodText, { color: colors.foreground }]}>
                        {displayMe.nowPlaying}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </PinnedCard>
            );
          }
          if (module.id === 'topFriends' && topFriends.length > 0) {
            return (
              <PinnedCard
                key={module.id}
                title={MODULE_LABELS.topFriends}
                accentColor={displayMe.accentColor}
              >
                <TopFriendsGrid friends={topFriends} />
              </PinnedCard>
            );
          }
          if (module.id === 'posts') {
            return (
              <View key={module.id} style={styles.postsSection}>
                <Text style={[styles.postsTitle, { color: colors.foreground }]}>Posts</Text>
                {myPosts.length === 0 ? (
                  <Text style={[styles.emptyPosts, { color: colors.mutedForeground }]}>
                    You have not posted anything yet.
                  </Text>
                ) : (
                  myPosts.map((post) => (
                    <PostCard key={post.id} post={post} author={displayMe} />
                  ))
                )}
              </View>
            );
          }
          return null;
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
  },
  content: {
    paddingBottom: 120,
  },
  body: {
    padding: 16,
    gap: 14,
  },
  bio: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  moodRows: {
    gap: 10,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moodText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  postsSection: {
    gap: 12,
  },
  postsTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    marginLeft: 2,
  },
  emptyPosts: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
});
