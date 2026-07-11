import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Audio } from 'expo-av';
import { Feather } from '@expo/vector-icons';
import { useSettings } from '@/context/SettingsContext';
import { useColors } from '@/hooks/useColors';

interface ProfileMusicPlayerProps {
  previewUrl: string | null;
  autoPlay?: boolean;
}

export function ProfileMusicPlayer({ previewUrl, autoPlay = false }: ProfileMusicPlayerProps) {
  const colors = useColors();
  const { settings, updateSettings } = useSettings();
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(settings.profileMusicMuted);

  useEffect(() => {
    setIsMuted(settings.profileMusicMuted);
  }, [settings.profileMusicMuted]);

  useEffect(() => {
    if (autoPlay && previewUrl && !isMuted) {
      playSound();
    }
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, [previewUrl, autoPlay, isMuted]);

  async function playSound() {
    if (!previewUrl) return;

    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: previewUrl },
        { shouldPlay: true, volume: isMuted ? 0 : 1 },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        }
      );

      soundRef.current = sound;
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  }

  async function togglePlay() {
    if (!soundRef.current || !previewUrl) {
      await playSound();
      return;
    }

    const status = await soundRef.current.getStatusAsync();
    if (status.isLoaded) {
      if (status.isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    }
  }

  async function toggleMute() {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    await updateSettings({ profileMusicMuted: newMuted });

    if (soundRef.current) {
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded) {
        await soundRef.current.setVolumeAsync(newMuted ? 0 : 1);
      }
    }
  }

  if (!previewUrl) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Pressable
        onPress={togglePlay}
        style={[styles.playButton, { borderColor: colors.border }]}
        hitSlop={8}
      >
        <Feather
          name={isPlaying ? 'pause' : 'play'}
          size={16}
          color={colors.foreground}
        />
      </Pressable>

      <View style={styles.textContainer}>
        <Text style={[styles.label, { color: colors.foreground }]}>Profile Song</Text>
        <Text style={[styles.status, { color: colors.mutedForeground }]}>
          {isMuted ? 'Muted' : isPlaying ? 'Playing' : 'Paused'}
        </Text>
      </View>

      <Pressable
        onPress={toggleMute}
        style={styles.muteButton}
        hitSlop={8}
      >
        <Feather
          name={isMuted ? 'volume-x' : 'volume-2'}
          size={18}
          color={isMuted ? colors.mutedForeground : colors.foreground}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 8,
    gap: 10,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  status: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: 2,
  },
  muteButton: {
    padding: 4,
  },
});
