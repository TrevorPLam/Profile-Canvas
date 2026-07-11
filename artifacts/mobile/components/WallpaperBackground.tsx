import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getWallpaper } from '@/lib/theme';

interface WallpaperBackgroundProps {
  wallpaper: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function WallpaperBackground({ wallpaper, style, children }: WallpaperBackgroundProps) {
  const preset = getWallpaper(wallpaper);
  return (
    <LinearGradient
      colors={preset.colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}
