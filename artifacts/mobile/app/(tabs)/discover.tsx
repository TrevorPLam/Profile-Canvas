import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { useSocialData } from '@/context/SocialDataContext';
import { useColors } from '@/hooks/useColors';
import { ME_ID } from '@/lib/mockData';

export default function DiscoverScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profiles, friendIds, requests, acceptFriendRequest, declineFriendRequest, sendFriendRequest } =
    useSocialData();

  const suggested = useMemo(
    () =>
      Object.values(profiles).filter(
        (p) =>
          p.id !== ME_ID && !friendIds.includes(p.id) && !requests.some((r) => r.fromUserId === p.id),
      ),
    [profiles, friendIds, requests],
  );

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>Discover</Text>

      {requests.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Friend requests
          </Text>
          {requests.map((req) => {
            const requester = profiles[req.fromUserId];
            if (!requester) return null;
            return (
              <View key={req.id} style={styles.requestRow}>
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
              </View>
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
            <View key={person.id} style={styles.requestRow}>
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
            </View>
          ))
        )}
      </View>
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
