import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { EmptyState } from '@/components/EmptyState';
import { FriendRow } from '@/components/FriendRow';
import { TopFriendsGrid } from '@/components/TopFriendsGrid';
import { useSocialData } from '@/context/SocialDataContext';
import { useColors } from '@/hooks/useColors';

export default function FriendsListScreen() {
  const colors = useColors();
  const { me, profiles, friendIds, removeFriend } = useSocialData();

  const friends = useMemo(
    () => friendIds.map((id) => profiles[id]).filter((p): p is NonNullable<typeof p> => !!p),
    [friendIds, profiles],
  );

  const topFriends = useMemo(
    () => me.topFriendIds.map((id) => profiles[id]).filter((p): p is NonNullable<typeof p> => !!p),
    [me.topFriendIds, profiles],
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
              subtitle="Head to Discover to find people to add."
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
});
