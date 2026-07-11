import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { PinnedCard } from '@/components/PinnedCard';
import { PostCard } from '@/components/PostCard';
import { ProfileHeader } from '@/components/ProfileHeader';
import { TopFriendsGrid } from '@/components/TopFriendsGrid';
import { useSocialData } from '@/context/SocialDataContext';
import { useColors } from '@/hooks/useColors';
import { MODULE_LABELS } from '@/lib/theme';
import { visibleModulesFor } from '@/lib/modules';
import type { Post } from '@/lib/types';

export default function MyProfileScreen() {
  const colors = useColors();
  const { me, posts, profiles, friendIds, toggleLike } = useSocialData();

  const myPosts = useMemo(
    () =>
      posts
        .filter(
          (p): p is Extract<Post, { kind: 'text' | 'video' }> =>
            p.authorId === me.id && p.kind !== 'reel'
        )
        .sort((a, b) => b.createdAt - a.createdAt),
    [posts, me.id]
  );

  const topFriends = useMemo(
    () => me.topFriendIds.map((id) => profiles[id]).filter((p): p is NonNullable<typeof p> => !!p),
    [me.topFriendIds, profiles]
  );

  const modules = visibleModulesFor(me, true, false);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ProfileHeader
        profile={me}
        friendCount={friendIds.length}
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
              <PinnedCard key={module.id} title={MODULE_LABELS.about} accentColor={me.accentColor}>
                <Text style={[styles.bio, { color: colors.foreground }]}>{me.bio}</Text>
              </PinnedCard>
            );
          }
          if (module.id === 'mood' && (me.moodLabel || me.nowPlaying)) {
            return (
              <PinnedCard key={module.id} title={MODULE_LABELS.mood} accentColor={me.accentColor}>
                <View style={styles.moodRows}>
                  {me.moodLabel ? (
                    <View style={styles.moodRow}>
                      <Feather
                        name={(me.moodIcon as never) ?? 'smile'}
                        size={15}
                        color={colors.mutedForeground}
                      />
                      <Text style={[styles.moodText, { color: colors.foreground }]}>
                        Feeling {me.moodLabel.toLowerCase()}
                      </Text>
                    </View>
                  ) : null}
                  {me.nowPlaying ? (
                    <View style={styles.moodRow}>
                      <Feather name="music" size={15} color={colors.mutedForeground} />
                      <Text style={[styles.moodText, { color: colors.foreground }]}>
                        {me.nowPlaying}
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
                accentColor={me.accentColor}
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
                    <PostCard key={post.id} post={post} author={me} onToggleLike={toggleLike} />
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
