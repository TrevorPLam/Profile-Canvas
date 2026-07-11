import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, Href } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { useColors } from '@/hooks/useColors';
import type { UserProfile } from '@/lib/types';

interface FriendRowProps {
  user: UserProfile;
  rightSlot?: React.ReactNode;
}

export function FriendRow({ user, rightSlot }: FriendRowProps) {
  const colors = useColors();
  return (
    <Pressable style={styles.row} onPress={() => router.push(`/profile/${user.id}` as Href)}>
      <Avatar name={user.name} color={user.avatarColor} size={46} />
      <View style={styles.textWrap}>
        <Text style={[styles.name, { color: colors.foreground }]}>{user.name}</Text>
        <Text style={[styles.handle, { color: colors.mutedForeground }]} numberOfLines={1}>
          {user.bio}
        </Text>
      </View>
      {rightSlot ?? <Feather name="chevron-right" size={18} color={colors.mutedForeground} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  handle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
});
