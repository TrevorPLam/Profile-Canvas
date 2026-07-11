import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { EmptyState } from '@/components/EmptyState';
import { PinnedCard } from '@/components/PinnedCard';
import { PostCard } from '@/components/PostCard';
import { ProfileHeader } from '@/components/ProfileHeader';
import { useColors } from '@/hooks/useColors';
import { useProfile } from '@/hooks/useProfile';
import { useIsFriend, useRemoveFriend, useSendFriendRequest } from '@/hooks/useFriendship';
import { visibleModulesFor } from '@/lib/modules';
import { MODULE_LABELS } from '@/lib/theme';
import type { Post } from '@/lib/types';

export default function OtherProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();

  // Fetch profile from backend by handle (id is actually the handle)
  const { data: profile, isLoading: profileLoading, error: profileError } = useProfile(id);
  const { data: isFriend } = useIsFriend(profile?.id);
  const sendFriendRequest = useSendFriendRequest();
  const removeFriendMutation = useRemoveFriend();

  // Posts will be fetched from API in a future task
  const theirPosts: Extract<Post, { kind: 'text' | 'video' }>[] = [];

  const friend = isFriend ?? false;

  // For now, skip top friends module since we don't have the profiles loaded
  // This will be addressed in MOB-010 when we implement the full friends list
  const showTopFriends = false;

  if (profileLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (profileError || !profile) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <EmptyState icon="user-x" title="Profile not found" />
      </View>
    );
  }

  const modules = visibleModulesFor(profile, false, friend);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: profile.handle,
          headerLeft: () => (
            <Feather
              name="chevron-left"
              size={24}
              color={colors.foreground}
              onPress={() => router.back()}
              style={{ marginRight: 8 }}
            />
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ProfileHeader
          profile={profile}
          friendCount={profile.friendCount}
          postCount={theirPosts.length}
          isMe={false}
          isFriend={friend}
          onAddFriend={() => sendFriendRequest.mutate(profile.id)}
          onRemoveFriend={() => removeFriendMutation.mutate(profile.id)}
        />

        <View style={styles.body}>
          {modules.length === 0 ? (
            <EmptyState
              icon="lock"
              title="This profile is private"
              subtitle={`${profile.name.split(' ')[0]} only shares this with friends.`}
            />
          ) : (
            modules.map((module) => {
              if (module.id === 'about') {
                return (
                  <PinnedCard
                    key={module.id}
                    title={MODULE_LABELS.about}
                    accentColor={profile.accentColor}
                  >
                    <Text style={[styles.bio, { color: colors.foreground }]}>{profile.bio}</Text>
                  </PinnedCard>
                );
              }
              if (module.id === 'mood' && (profile.moodLabel || profile.nowPlaying)) {
                return (
                  <PinnedCard
                    key={module.id}
                    title={MODULE_LABELS.mood}
                    accentColor={profile.accentColor}
                  >
                    <View style={styles.moodRows}>
                      {profile.moodLabel ? (
                        <View style={styles.moodRow}>
                          <Feather
                            name={(profile.moodIcon as never) ?? 'smile'}
                            size={15}
                            color={colors.mutedForeground}
                          />
                          <Text style={[styles.moodText, { color: colors.foreground }]}>
                            Feeling {profile.moodLabel.toLowerCase()}
                          </Text>
                        </View>
                      ) : null}
                      {profile.nowPlaying ? (
                        <View style={styles.moodRow}>
                          <Feather name="music" size={15} color={colors.mutedForeground} />
                          <Text style={[styles.moodText, { color: colors.foreground }]}>
                            {profile.nowPlaying}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </PinnedCard>
                );
              }
              if (module.id === 'topFriends' && showTopFriends) {
                // Top friends will be implemented in MOB-010
                return null;
              }
              if (module.id === 'posts') {
                return (
                  <View key={module.id} style={styles.postsSection}>
                    <Text style={[styles.postsTitle, { color: colors.foreground }]}>Posts</Text>
                    {theirPosts.length === 0 ? (
                      <Text style={[styles.emptyPosts, { color: colors.mutedForeground }]}>
                        No posts yet.
                      </Text>
                    ) : (
                      theirPosts.map((post) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          author={profile}
                        />
                      ))
                    )}
                  </View>
                );
              }
              return null;
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFound: {
    flex: 1,
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
