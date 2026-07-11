import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface PinnedCardProps {
  title?: string;
  accentColor?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}

export function PinnedCard({ title, accentColor, children, right }: PinnedCardProps) {
  const colors = useColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.pin, { backgroundColor: accentColor ?? colors.primary }]}>
        <Feather name="disc" size={10} color="rgba(255,255,255,0.001)" />
      </View>
      {title ? (
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    paddingTop: 20,
    position: 'relative',
  },
  pin: {
    position: 'absolute',
    top: -8,
    left: 20,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    letterSpacing: 0.2,
  },
});
