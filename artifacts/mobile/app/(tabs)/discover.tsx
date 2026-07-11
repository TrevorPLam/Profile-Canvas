import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { useSocialData } from '@/context/SocialDataContext';
import { useColors } from '@/hooks/useColors';
import { ME_ID } from '@/lib/mockData';

export default function DiscoverScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profiles, friendIds, requests, isFriend, acceptFriendRequest, declineFriendRequest, sendFriendRequest } =
    useSocialData();
  const [query, setQuery] = useState('');

  const suggested = useMemo(
    () =>
      Object.values(profiles).filter(
        (p) =>
          p.id !== ME_ID && !friendIds.includes(p.id) && !requests.some((r) => r.fromUserId === p.id),
      ),
    [profiles, friendIds, requests],
  );

  const trimmedQuery = query.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!trimmedQuery) return [];
    return Object.values(profiles).filter(
      (p) =>
        p.id !== ME_ID &&
        (p.name.toLowerCase().includes(trimmedQuery) || p.handle.toLowerCase().includes(trimmedQuery)),
    );
  }, [profiles, trimmedQuery]);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>Discover</Text>

      <View style={[styles.searchBar, { backgroundColor: colors.secondary }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search people by name or handle"
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

      {trimmedQuery ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Search results</Text>
          {searchResults.length === 0 ? (
            <EmptyState
              icon="search"
              title="No one found"
              subtitle="Try a different name or handle."
            />
          ) : (
            searchResults.map((person) => {
              const friend = isFriend(person.id);
              return (
                <Pressable
                  key={person.id}
                  style={styles.requestRow}
                  onPress={() => router.push(`/profile/${person.id}`)}
                >
                  <Avatar name={person.name} color={person.avatarColor} size={44} />
                  <View style={styles.requestText}>
                    <Text style={[styles.requestName, { color: colors.foreground }]}>
                      {person.name}
                    </Text>
                    <Text
                      style={[styles.requestHandle, { color: colors.mutedForeground }]}
                      numberOfLines={1}
                    >
                      {person.handle}
                    </Text>
                  </View>
                  {friend ? (
                    <View style={styles.friendBadge}>
                      <Feather name="check" size={13} color={colors.mutedForeground} />
                      <Text style={[styles.friendBadgeText, { color: colors.mutedForeground }]}>
                        Friends
                      </Text>
                    </View>
                  ) : (
                    <Pressable
                      style={[styles.addBtn, { backgroundColor: colors.secondary }]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        sendFriendRequest(person.id);
                      }}
                    >
                      <Feather name="user-plus" size={14} color={colors.foreground} />
                      <Text style={[styles.addBtnText, { color: colors.foreground }]}>Add</Text>
                    </Pressable>
                  )}
                </Pressable>
              );
            })
          )}
        </View>
      ) : (
        <>
          {requests.length > 0 ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Friend requests
              </Text>
              {requests.map((req) => {
                const requester = profiles[req.fromUserId];
                if (!requester) return null;
                return (
                  <Pressable
                    key={req.id}
                    style={styles.requestRow}
                    onPress={() => router.push(`/profile/${requester.id}`)}
                  >
                    <Avatar name={requester.name} color={requester.avatarColor} size={44} />
                    <View style={styles.requestText}>
                      <Text style={[styles.requestName, { color: colors.foreground }]}>
                        {requester.name}
                      </Text>
                      <Text style={[styles.requestHandle, { color: colors.mutedForeground }]}>
                        wants to be friends
                      </Text>
                    </View>
                    <Pressable
                      style={[styles.circleBtn, { backgroundColor: colors.primary }]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        acceptFriendRequest(req.id);
                      }}
                    >
                      <Feather name="check" size={16} color="#FFFCF5" />
                    </Pressable>
                    <Pressable
                      style={[styles.circleBtn, { backgroundColor: colors.secondary }]}
                      onPress={() => declineFriendRequest(req.id)}
                    >
                      <Feather name="x" size={16} color={colors.mutedForeground} />
                    </Pressable>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              People you may know
            </Text>
            {suggested.length === 0 ? (
              <EmptyState
                icon="compass"
                title="You're all caught up"
                subtitle="Check back later for more people to discover."
              />
            ) : (
              suggested.map((person) => (
                <Pressable
                  key={person.id}
                  style={styles.requestRow}
                  onPress={() => router.push(`/profile/${person.id}`)}
                >
                  <Avatar name={person.name} color={person.avatarColor} size={44} />
                  <View style={styles.requestText}>
                    <Text style={[styles.requestName, { color: colors.foreground }]}>
                      {person.name}
                    </Text>
                    <Text
                      style={[styles.requestHandle, { color: colors.mutedForeground }]}
                      numberOfLines={1}
                    >
                      {person.bio}
                    </Text>
                  </View>
                  <Pressable
                    style={[styles.addBtn, { backgroundColor: colors.secondary }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      sendFriendRequest(person.id);
                    }}
                  >
                    <Feather name="user-plus" size={14} color={colors.foreground} />
                    <Text style={[styles.addBtnText, { color: colors.foreground }]}>Add</Text>
                  </Pressable>
                </Pressable>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 18,
    paddingBottom: 140,
    gap: 26,
  },
  pageTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
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
  friendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  friendBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  section: {
    gap: 4,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    marginBottom: 8,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  requestText: {
    flex: 1,
    gap: 2,
  },
  requestName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  requestHandle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  circleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  addBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
});
