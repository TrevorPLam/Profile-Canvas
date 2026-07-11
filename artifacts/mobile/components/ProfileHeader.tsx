import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Avatar } from '@/components/Avatar';
import { MoodBadge } from '@/components/MoodBadge';
import { WallpaperBackground } from '@/components/WallpaperBackground';
import { getWallpaper } from '@/lib/theme';
import type { UserProfile } from '@/lib/types';

interface ProfileHeaderProps {
  profile: UserProfile;
  friendCount: number;
  postCount: number;
  isMe: boolean;
  isFriend: boolean;
  onEdit?: () => void;
  onAddFriend?: () => void;
  onRemoveFriend?: () => void;
}

export function ProfileHeader({
  profile,
  friendCount,
  postCount,
  isMe,
  isFriend,
  onEdit,
  onAddFriend,
  onRemoveFriend,
}: ProfileHeaderProps) {
  const wallpaper = getWallpaper(profile.wallpaper);

  return (
    <WallpaperBackground wallpaper={profile.wallpaper} style={styles.wrap}>
      <View style={styles.topRow}>
        <Avatar name={profile.name} color={profile.avatarColor} size={78} ringColor="#FFFCF5" />
        {isMe ? (
          <Pressable style={styles.editBtn} onPress={onEdit}>
            <Feather name="edit-2" size={14} color={wallpaper.textOnWallpaper} />
            <Text style={[styles.editText, { color: wallpaper.textOnWallpaper }]}>
              Customize
            </Text>
          </Pressable>
        ) : isFriend ? (
          <Pressable style={styles.editBtn} onPress={onRemoveFriend}>
            <Feather name="check" size={14} color={wallpaper.textOnWallpaper} />
            <Text style={[styles.editText, { color: wallpaper.textOnWallpaper }]}>Friends</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.editBtn, { backgroundColor: profile.accentColor }]}
            onPress={onAddFriend}
          >
            <Feather name="user-plus" size={14} color="#FFFCF5" />
            <Text style={[styles.editText, { color: '#FFFCF5' }]}>Add Friend</Text>
          </Pressable>
        )}
      </View>

      <Text style={[styles.name, { color: wallpaper.textOnWallpaper }]}>{profile.name}</Text>
      <Text style={[styles.handle, { color: wallpaper.textOnWallpaper }]}>{profile.handle}</Text>

      <MoodBadge icon={profile.moodIcon} label={profile.moodLabel} />

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[styles.statNumber, { color: wallpaper.textOnWallpaper }]}>
            {friendCount}
          </Text>
          <Text style={[styles.statLabel, { color: wallpaper.textOnWallpaper }]}>Friends</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statNumber, { color: wallpaper.textOnWallpaper }]}>
            {postCount}
          </Text>
          <Text style={[styles.statLabel, { color: wallpaper.textOnWallpaper }]}>Posts</Text>
        </View>
        <View style={styles.stat}>
          <Feather name="clock" size={12} color={wallpaper.textOnWallpaper} />
          <Text style={[styles.statLabel, { color: wallpaper.textOnWallpaper }]}>
            {profile.joinedLabel}
          </Text>
        </View>
      </View>
    </WallpaperBackground>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 22,
    gap: 8,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  editText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  name: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    marginTop: 6,
  },
  handle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    opacity: 0.85,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 6,
    alignItems: 'center',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  statNumber: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  statLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    opacity: 0.85,
  },
});
