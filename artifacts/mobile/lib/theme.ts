import type { MoodOption, WallpaperPreset } from '@/lib/types';

export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  { key: 'cork', label: 'Cork', colors: ['#E3C293', '#C79A64'], textOnWallpaper: '#3B2A1E' },
  { key: 'denim', label: 'Denim', colors: ['#4C6E92', '#243A54'], textOnWallpaper: '#F6F3EC' },
  { key: 'forest', label: 'Pine', colors: ['#3E6350', '#1D2E24'], textOnWallpaper: '#F6F3EC' },
  { key: 'sunset', label: 'Sunset', colors: ['#F4A67A', '#E0654F'], textOnWallpaper: '#3B2013' },
  {
    key: 'midnight',
    label: 'Midnight',
    colors: ['#3A2E5C', '#181B33'],
    textOnWallpaper: '#F1EEFA',
  },
  { key: 'pastel', label: 'Pastel', colors: ['#F6D2DE', '#CFE0EF'], textOnWallpaper: '#4A3B45' },
  { key: 'neon', label: 'Neon', colors: ['#FF3D7F', '#7B2FF7'], textOnWallpaper: '#FBF3FF' },
  { key: 'paper', label: 'Notebook', colors: ['#F1EAD6', '#DCD0AE'], textOnWallpaper: '#3B2A1E' },
];

export function getWallpaper(key: string): WallpaperPreset {
  return WALLPAPER_PRESETS.find((w) => w.key === key) ?? WALLPAPER_PRESETS[0]!;
}

export const ACCENT_COLORS: string[] = [
  '#D9603B',
  '#4C7A6B',
  '#7B2FF7',
  '#3B5B7A',
  '#C9A64A',
  '#B0455F',
  '#3E8E7E',
  '#8E4A8C',
];

export const AVATAR_COLORS: string[] = [
  '#D9603B',
  '#4C7A6B',
  '#7B6BC9',
  '#3B5B7A',
  '#C9964A',
  '#B0455F',
  '#3E8E7E',
  '#8E4A8C',
];

export const MOOD_OPTIONS: MoodOption[] = [
  { label: 'Vibing', icon: 'headphones' },
  { label: 'Chill', icon: 'coffee' },
  { label: 'Hype', icon: 'zap' },
  { label: 'Sleepy', icon: 'moon' },
  { label: 'Thoughtful', icon: 'cloud' },
  { label: 'Good day', icon: 'sun' },
  { label: 'In love', icon: 'heart' },
  { label: 'Focused', icon: 'target' },
];

export const MODULE_LABELS: Record<string, string> = {
  about: 'About Me',
  topFriends: 'Top Friends',
  mood: 'Mood & Sound',
  posts: 'Posts',
};

export function colorForId(id: string, palette: string[]): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return palette[hash % palette.length]!;
}

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}
