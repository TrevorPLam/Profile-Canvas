import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, Stack } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { FriendRow } from '@/components/FriendRow';
import { TopFriendsGrid } from '@/components/TopFriendsGrid';
import { useSocialData } from '@/context/SocialDataContext';
import { useColors } from '@/hooks/useColors';
import { ME_ID } from '@/lib/mockData';

export default function FriendsListScreen() {
  const colors = useColors();
  const {
    me,
    profiles,
    friendIds,
    requests,
    removeFriend,
    acceptFriendRequest,
    declineFriendRequest,
    sendFriendRequest,
  } = useSocialData();

  const friends = useMemo(
    () => friendIds.map((id) => profiles[id]).filter((p): p is NonNullable<typeof p> => !!p),
    [friendIds, profiles],
  );

  const topFriends = useMemo(
    () => me.topFriendIds.map((id) => profiles[id]).filter((p): p is NonNullable<typeof p> => !!p),
    [me.topFriendIds, profiles],
  );

  const suggested = useMemo(
    () =>
      Object.values(profiles).filter(
        (p) =>
          p.id !== ME_ID && !friendIds.includes(p.id) && !requests.some((r) => r.fromUserId === p.id),
      ),
    [profiles, friendIds, requests],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: 'Friends',
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

        {topFriends.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Top friends</Text>
            <TopFriendsGrid friends={topFriends} />
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            All friends ({friends.length})
          </Text>
          {friends.length === 0 ? (
            <EmptyState
              icon="users"
              title="No friends yet"
              subtitle="Add people from the suggestions below or their profile page."
            />
          ) : (
            friends.map((friend) => (
              <FriendRow
                key={friend.id}
                user={friend}
                rightSlot={
                  <Pressable
                    onPress={() => removeFriend(friend.id)}
                    hitSlop={8}
                    style={[styles.removeBtn, { backgroundColor: colors.secondary }]}
                  >
                    <Feather name="x" size={14} color={colors.mutedForeground} />
                  </Pressable>
                }
              />
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            People you may know
          </Text>
          {suggested.length === 0 ? (
            <EmptyState
              icon="user-check"
              title="You're all caught up"
              subtitle="Check back later for more people to add."
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
    paddingBottom: 60,
    gap: 26,
  },
  section: {
    gap: 4,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    marginBottom: 8,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
