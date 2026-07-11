import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { useMyProfile } from '@/hooks/useProfile';
import { useUpdateProfile, useUpdateTopFriends } from '@/hooks/useUpdateProfile';
import { useUploadAvatar } from '@/hooks/useUploadAvatar';
import { useColors } from '@/hooks/useColors';
import { useFriends } from '@/hooks/useFriends';
import { useTopFriends } from '@/hooks/useFriends';
import { ACCENT_COLORS, MODULE_LABELS, MOOD_OPTIONS, WALLPAPER_PRESETS } from '@/lib/theme';
import type { ModuleId, Visibility } from '@/lib/types';

type Tab = 'appearance' | 'about' | 'layout' | 'topFriends';

const TABS: { id: Tab; label: string }[] = [
  { id: 'appearance', label: 'Appearance' },
  { id: 'about', label: 'About' },
  { id: 'layout', label: 'Layout' },
  { id: 'topFriends', label: 'Top Friends' },
];

const AUDIENCE_OPTIONS: { id: Visibility; label: string }[] = [
  { id: 'everyone', label: 'Everyone' },
  { id: 'friends', label: 'Friends' },
  { id: 'onlyMe', label: 'Only me' },
];

export default function EditProfileScreen() {
  const colors = useColors();
  const { data: apiMe, isLoading: profileLoading } = useMyProfile();
  const { data: friendsData } = useFriends();
  const { data: topFriendsData } = useTopFriends();
  const updateProfile = useUpdateProfile();
  const updateTopFriends = useUpdateTopFriends();
  const { pickAndUploadAvatar, isUploading } = useUploadAvatar();

  // Show loading state while profile loads
  if (profileLoading || !apiMe) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const me = apiMe;

  const [tab, setTab] = useState<Tab>('appearance');
  const [bio, setBio] = useState(me.bio);
  const [nowPlaying, setNowPlaying] = useState(me.nowPlaying ?? '');

  const sortedModules = [...me.modules].sort((a, b) => a.order - b.order);

  // Transform API friend data to mobile UserProfile format
  const apiFriends = friendsData?.friends || [];
  const friends = useMemo(() => {
    return apiFriends.map((friend: { userId: string; handle: string; name: string; avatarUrl: string | null }) => ({
      id: friend.userId,
      name: friend.name,
      handle: friend.handle,
      bio: '',
      avatarColor: '#6366f1', // Default color since API doesn't provide it
      avatarUrl: friend.avatarUrl,
      wallpaper: '',
      accentColor: '#6366f1',
      moodLabel: null,
      moodIcon: null,
      nowPlaying: null,
      joinedLabel: '',
      topFriendIds: [],
      friendCount: 0,
      modules: [],
    }));
  }, [apiFriends]);

  // Use API top friends data
  const topFriendIds = useMemo(() => {
    return topFriendsData?.topFriendIds || me.topFriendIds;
  }, [topFriendsData, me.topFriendIds]);

  // Helper to update profile via API
  const handleUpdateProfile = (patch: Record<string, unknown>) => {
    updateProfile.mutate(patch);
  };

  // Helper to update module visibility
  const setModuleVisible = (moduleId: ModuleId, visible: boolean) => {
    const modules = me.modules.map((m) => (m.id === moduleId ? { ...m, visible } : m));
    handleUpdateProfile({ moduleSettings: { modules } });
  };

  // Helper to update module audience
  const setModuleAudience = (moduleId: ModuleId, visibility: Visibility) => {
    const modules = me.modules.map((m) => (m.id === moduleId ? { ...m, visibility } : m));
    handleUpdateProfile({ moduleSettings: { modules } });
  };

  // Helper to reorder modules
  const reorderModule = (moduleId: ModuleId, direction: -1 | 1) => {
    const sorted = [...me.modules].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((m) => m.id === moduleId);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) return;
    const a = sorted[index]!;
    const b = sorted[targetIndex]!;
    sorted[index] = { ...b, order: a.order };
    sorted[targetIndex] = { ...a, order: b.order };
    handleUpdateProfile({ moduleSettings: { modules: sorted } });
  };

  // Helper to update top friends
  const setTopFriends = (ids: string[]) => {
    updateTopFriends.mutate(ids);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: 'Customize profile',
          presentation: 'modal',
          headerLeft: () => (
            <Feather
              name="x"
              size={22}
              color={colors.foreground}
              onPress={() => router.back()}
              style={{ marginRight: 8 }}
            />
          ),
        }}
      />

      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setTab(t.id)}
            style={[styles.tabBtn, tab === t.id && { backgroundColor: colors.primary }]}
          >
            <Text
              style={[
                styles.tabLabel,
                { color: tab === t.id ? '#FFFCF5' : colors.mutedForeground },
              ]}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {tab === 'appearance' ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Avatar</Text>
            <Pressable
              onPress={pickAndUploadAvatar}
              disabled={isUploading}
              style={styles.avatarPicker}
            >
              <Avatar
                name={me.name}
                color={me.avatarColor}
                avatarUrl={me.avatarUrl}
                size={80}
              />
              {isUploading ? (
                <Feather name="loader" size={20} color={colors.mutedForeground} />
              ) : (
                <Feather name="camera" size={20} color={colors.mutedForeground} />
              )}
            </Pressable>

            <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 22 }]}>Wallpaper</Text>
            <View style={styles.wallpaperGrid}>
              {WALLPAPER_PRESETS.map((preset) => (
                <Pressable
                  key={preset.key}
                  onPress={() => handleUpdateProfile({ wallpaper: preset.key })}
                  style={styles.wallpaperItem}
                >
                  <View
                    style={[
                      styles.wallpaperSwatch,
                      { backgroundColor: preset.colors[0] },
                      me.wallpaper === preset.key && {
                        borderColor: colors.foreground,
                        borderWidth: 3,
                      },
                    ]}
                  />
                  <Text style={[styles.wallpaperLabel, { color: colors.mutedForeground }]}>
                    {preset.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 22 }]}>
              Accent color
            </Text>
            <View style={styles.swatchRow}>
              {ACCENT_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => handleUpdateProfile({ accentColor: c })}
                  style={[
                    styles.swatch,
                    { backgroundColor: c },
                    me.accentColor === c && { borderColor: colors.foreground, borderWidth: 3 },
                  ]}
                />
              ))}
            </View>
          </View>
        ) : null}

        {tab === 'about' ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Bio</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              onEndEditing={() => handleUpdateProfile({ bio })}
              onBlur={() => handleUpdateProfile({ bio })}
              multiline
              placeholder="Tell people about yourself"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.textArea,
                {
                  color: colors.foreground,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            />

            <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 20 }]}>
              Mood
            </Text>
            <View style={styles.moodGrid}>
              {MOOD_OPTIONS.map((mood) => {
                const active = me.moodLabel === mood.label;
                return (
                  <Pressable
                    key={mood.label}
                    onPress={() =>
                      handleUpdateProfile(
                        active
                          ? { moodLabel: null, moodIcon: null }
                          : { moodLabel: mood.label, moodIcon: mood.icon }
                      )
                    }
                    style={[
                      styles.moodChip,
                      { borderColor: colors.border },
                      active && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                  >
                    <Feather
                      name={mood.icon as never}
                      size={14}
                      color={active ? '#FFFCF5' : colors.mutedForeground}
                    />
                    <Text
                      style={[
                        styles.moodChipText,
                        { color: active ? '#FFFCF5' : colors.foreground },
                      ]}
                    >
                      {mood.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 20 }]}>
              Now playing
            </Text>
            <TextInput
              value={nowPlaying}
              onChangeText={setNowPlaying}
              onEndEditing={() => handleUpdateProfile({ nowPlaying: nowPlaying.trim() || null })}
              onBlur={() => handleUpdateProfile({ nowPlaying: nowPlaying.trim() || null })}
              placeholder="Song, artist, or vibe"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            />
          </View>
        ) : null}

        {tab === 'layout' ? (
          <View style={styles.section}>
            <Text style={[styles.helperText, { color: colors.mutedForeground }]}>
              Choose what shows on your profile, who can see it, and in what order.
            </Text>
            {sortedModules.map((module, index) => (
              <View
                key={module.id}
                style={[
                  styles.moduleRow,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.moduleTop}>
                  <Text style={[styles.moduleTitle, { color: colors.foreground }]}>
                    {MODULE_LABELS[module.id]}
                  </Text>
                  <Switch
                    value={module.visible}
                    onValueChange={(v) => setModuleVisible(module.id as ModuleId, v)}
                    trackColor={{ false: colors.secondary, true: colors.primary }}
                  />
                </View>
                <View style={styles.moduleBottom}>
                  <View style={styles.audienceRow}>
                    {AUDIENCE_OPTIONS.map((opt) => (
                      <Pressable
                        key={opt.id}
                        onPress={() => setModuleAudience(module.id as ModuleId, opt.id)}
                        style={[
                          styles.audienceChip,
                          { borderColor: colors.border },
                          module.visibility === opt.id && {
                            backgroundColor: colors.secondary,
                            borderColor: colors.foreground,
                          },
                        ]}
                      >
                        <Text style={[styles.audienceText, { color: colors.foreground }]}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={styles.reorderCol}>
                    <Pressable
                      disabled={index === 0}
                      onPress={() => reorderModule(module.id as ModuleId, -1)}
                      style={styles.reorderBtn}
                    >
                      <Feather
                        name="chevron-up"
                        size={16}
                        color={index === 0 ? colors.border : colors.mutedForeground}
                      />
                    </Pressable>
                    <Pressable
                      disabled={index === sortedModules.length - 1}
                      onPress={() => reorderModule(module.id as ModuleId, 1)}
                      style={styles.reorderBtn}
                    >
                      <Feather
                        name="chevron-down"
                        size={16}
                        color={
                          index === sortedModules.length - 1
                            ? colors.border
                            : colors.mutedForeground
                        }
                      />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {tab === 'topFriends' ? (
          <View style={styles.section}>
            <Text style={[styles.helperText, { color: colors.mutedForeground }]}>
              Tap friends in the order you want them pinned to your profile.
            </Text>
            {friends.length === 0 ? (
              <Text style={[styles.helperText, { color: colors.mutedForeground }]}>
                Add some friends first.
              </Text>
            ) : (
              friends.map((friend) => {
                const rank = topFriendIds.indexOf(friend.id);
                const selected = rank >= 0;
                return (
                  <Pressable
                    key={friend.id}
                    style={styles.friendPickRow}
                    onPress={() => {
                      if (selected) {
                        setTopFriends(topFriendIds.filter((id) => id !== friend.id));
                      } else {
                        setTopFriends([...topFriendIds, friend.id]);
                      }
                    }}
                  >
                    <Avatar name={friend.name} color={friend.avatarColor} size={40} avatarUrl={friend.avatarUrl} />
                    <Text style={[styles.friendPickName, { color: colors.foreground }]}>
                      {friend.name}
                    </Text>
                    {selected ? (
                      <View style={[styles.rankChip, { backgroundColor: colors.primary }]}>
                        <Text style={styles.rankChipText}>{rank + 1}</Text>
                      </View>
                    ) : (
                      <Feather name="circle" size={18} color={colors.border} />
                    )}
                  </Pressable>
                );
              })
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatarPicker: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  tabLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  content: {
    padding: 16,
    paddingBottom: 60,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    marginBottom: 4,
  },
  helperText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  wallpaperGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  wallpaperItem: {
    alignItems: 'center',
    gap: 6,
  },
  wallpaperSwatch: {
    width: 56,
    height: 56,
    borderRadius: 14,
  },
  wallpaperLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  swatch: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    minHeight: 90,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlignVertical: 'top',
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  moodChipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  moduleRow: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginBottom: 10,
  },
  moduleTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moduleTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  moduleBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  audienceRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  audienceChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  audienceText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  reorderCol: {
    gap: 2,
  },
  reorderBtn: {
    padding: 3,
  },
  friendPickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
  },
  friendPickName: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  rankChip: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankChipText: {
    color: '#FFFCF5',
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
  },
});
