import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { useColors } from '@/hooks/useColors';
import type { UserProfile } from '@/lib/types';

interface TopFriendsGridProps {
  friends: UserProfile[];
}

export function TopFriendsGrid({ friends }: TopFriendsGridProps) {
  const colors = useColors();
  return (
    <View style={styles.grid}>
      {friends.map((friend, index) => (
        <Pressable
          key={friend.id}
          style={styles.item}
          onPress={() =>
            friend.id === 'me'
              ? router.push('/(tabs)/profile')
              : router.push(`/profile/${friend.id}`)
          }
        >
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>{index + 1}</Text>
          </View>
          <Avatar name={friend.name} color={friend.avatarColor} size={60} />
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {friend.name.split(' ')[0]}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  item: {
    alignItems: 'center',
    width: 68,
    gap: 6,
    position: 'relative',
  },
  rankBadge: {
    position: 'absolute',
    top: -4,
    right: 2,
    backgroundColor: '#3B2A1E',
    borderRadius: 999,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  rankText: {
    color: '#FFFCF5',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  name: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
});
