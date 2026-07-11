import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, Stack, Href } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { FriendRow } from '@/components/FriendRow';
import { TopFriendsGrid } from '@/components/TopFriendsGrid';
import { useColors } from '@/hooks/useColors';
import { useFriends } from '@/hooks/useFriends';
import { useTopFriends } from '@/hooks/useFriends';
import { useIncomingFriendRequests } from '@/hooks/useFriendRequests';
import { useSendFriendRequest } from '@/hooks/useFriendship';
import { useAcceptFriendRequest } from '@/hooks/useFriendRequests';
import { useDeclineFriendRequest } from '@/hooks/useFriendRequests';
import { useRemoveFriend } from '@/hooks/useFriendship';
import { usePeopleSuggestions } from '@/hooks/usePeopleDiscovery';

export default function FriendsListScreen() {
  const colors = useColors();
  const { data: friendsData, isLoading: friendsLoading } = useFriends();
  const { data: topFriendsData } = useTopFriends();
  const { data: requestsData, isLoading: requestsLoading } = useIncomingFriendRequests();
  const { data: suggestionsData, isLoading: suggestionsLoading } = usePeopleSuggestions();

  const sendFriendRequest = useSendFriendRequest();
  const acceptFriendRequest = useAcceptFriendRequest();
  const declineFriendRequest = useDeclineFriendRequest();
  const removeFriend = useRemoveFriend();

  const friends = useMemo(() => friendsData?.friends || [], [friendsData]);

  const topFriends = useMemo(() => {
    if (!topFriendsData?.topFriendIds || !friendsData?.friends) return [];
    const friendMap = new Map(friendsData.friends.map((f) => [f.userId, f]));
    return topFriendsData.topFriendIds
      .map((id) => friendMap.get(id))
      .filter((p): p is NonNullable<typeof p> => !!p);
  }, [topFriendsData, friendsData]);

  const requests = useMemo(() => requestsData?.requests || [], [requestsData]);

  const suggested = useMemo(() => suggestionsData?.suggestions || [], [suggestionsData]);

  // Transform API friend request to mobile format
  const transformedRequests = useMemo(() => {
    return requests.map((req) => ({
      id: req.id,
      fromUserId: req.senderId,
      createdAt: new Date(req.createdAt).getTime(),
    }));
  }, [requests]);

  // Transform API friend profile to mobile UserProfile format
  const transformFriendToProfile = (friend: {
    userId: string;
    handle: string;
    name: string;
    avatarUrl: string | null;
  }) => ({
    id: friend.userId,
    name: friend.name,
    handle: friend.handle,
    bio: '',
    avatarColor: '#6366f1', // Default color since API doesn't provide it
    avatarUrl: friend.avatarUrl,
    wallpaper: '',
    accentColor: '#6366f1',
    moodLabel: null,
    moodIcon: null,
    nowPlaying: null,
    joinedLabel: '',
    topFriendIds: [],
    friendCount: 0,
    modules: [],
  });

  const transformedFriends = useMemo(() => friends.map(transformFriendToProfile), [friends]);
  const transformedTopFriends = useMemo(
    () => topFriends.map(transformFriendToProfile),
    [topFriends]
  );
  const transformedSuggested = useMemo(() => suggested.map(transformFriendToProfile), [suggested]);

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
        {friendsLoading || requestsLoading || suggestionsLoading ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : null}

        {transformedRequests.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Friend requests</Text>
            {transformedRequests.map((req) => {
              const requester = requests.find((r) => r.id === req.id);
              if (!requester) return null;
              const profile = transformFriendToProfile({
                userId: requester.senderId,
                handle: requester.senderHandle,
                name: requester.senderName,
                avatarUrl: requester.senderAvatarUrl,
              });
              return (
                <Pressable
                  key={req.id}
                  style={styles.requestRow}
                  onPress={() => router.push(`/profile/${profile.handle}` as Href)}
                >
                  <Avatar
                    name={profile.name}
                    color={profile.avatarColor}
                    size={44}
                    avatarUrl={profile.avatarUrl}
                  />
                  <View style={styles.requestText}>
                    <Text style={[styles.requestName, { color: colors.foreground }]}>
                      {profile.name}
                    </Text>
                    <Text style={[styles.requestHandle, { color: colors.mutedForeground }]}>
                      wants to be friends
                    </Text>
                  </View>
                  <Pressable
                    style={[styles.circleBtn, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      acceptFriendRequest.mutate(req.id);
                    }}
                  >
                    <Feather name="check" size={16} color="#FFFCF5" />
                  </Pressable>
                  <Pressable
                    style={[styles.circleBtn, { backgroundColor: colors.secondary }]}
                    onPress={() => declineFriendRequest.mutate(req.id)}
                  >
                    <Feather name="x" size={16} color={colors.mutedForeground} />
                  </Pressable>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {transformedTopFriends.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Top friends</Text>
            <TopFriendsGrid friends={transformedTopFriends} />
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            All friends ({transformedFriends.length})
          </Text>
          {transformedFriends.length === 0 ? (
            <EmptyState
              icon="users"
              title="No friends yet"
              subtitle="Add people from the suggestions below or their profile page."
            />
          ) : (
            transformedFriends.map((friend) => (
              <FriendRow
                key={friend.id}
                user={friend}
                rightSlot={
                  <Pressable
                    onPress={() => removeFriend.mutate(friend.id)}
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
          {transformedSuggested.length === 0 ? (
            <EmptyState
              icon="user-check"
              title="You're all caught up"
              subtitle="Check back later for more people to add."
            />
          ) : (
            transformedSuggested.map((person) => (
              <Pressable
                key={person.id}
                style={styles.requestRow}
                onPress={() => router.push(`/profile/${person.handle}` as Href)}
              >
                <Avatar
                  name={person.name}
                  color={person.avatarColor}
                  size={44}
                  avatarUrl={person.avatarUrl}
                />
                <View style={styles.requestText}>
                  <Text style={[styles.requestName, { color: colors.foreground }]}>
                    {person.name}
                  </Text>
                  <Text
                    style={[styles.requestHandle, { color: colors.mutedForeground }]}
                    numberOfLines={1}
                  >
                    {person.bio || `@${person.handle}`}
                  </Text>
                </View>
                <Pressable
                  style={[styles.addBtn, { backgroundColor: colors.secondary }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    sendFriendRequest.mutate(person.id);
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
