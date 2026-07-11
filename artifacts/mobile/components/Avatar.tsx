import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { initialsFor } from '@/lib/theme';

interface AvatarProps {
  name: string;
  color: string;
  size?: number;
  ringColor?: string;
  avatarUrl?: string | null;
}

export function Avatar({ name, color, size = 48, ringColor, avatarUrl }: AvatarProps) {
  const fontSize = size * 0.38;
  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          borderColor: ringColor ?? 'transparent',
          borderWidth: ringColor ? 2.5 : 0,
        },
      ]}
    >
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <Text style={[styles.initials, { fontSize }]}>{initialsFor(name)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFCF5',
    fontFamily: 'Inter_700Bold',
  },
  image: {
    resizeMode: 'cover',
  },
});
