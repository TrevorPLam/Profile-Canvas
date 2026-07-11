import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface MoodBadgeProps {
  icon?: string | null;
  label?: string | null;
  tone?: 'light' | 'dark';
}

export function MoodBadge({ icon, label, tone = 'light' }: MoodBadgeProps) {
  const colors = useColors();
  if (!icon || !label) return null;
  const bg = tone === 'light' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.28)';
  const fg = tone === 'light' ? colors.foreground : '#FFFCF5';
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Feather name={icon as never} size={13} color={fg} />
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
});
