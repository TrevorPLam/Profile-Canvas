import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, Stack } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useCreateMediaPost, pickVideo, recordVideo } from '@/hooks/useCreateMediaPost';
import { useColors } from '@/hooks/useColors';

const MAX_LENGTH = 280;

type MediaType = 'video' | 'reel';

export default function ComposeMediaScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const { createMediaPost, isCreating } = useCreateMediaPost();
  const [mediaType, setMediaType] = useState<MediaType>('video');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('video/mp4');
  const [text, setText] = useState('');

  const pickFromLibrary = async () => {
    const result = await pickVideo();
    if (result) {
      setMediaUri(result.uri);
      setMimeType(result.mimeType);
    }
  };

  const recordWithCamera = async () => {
    const result = await recordVideo();
    if (result) {
      setMediaUri(result.uri);
      setMimeType(result.mimeType);
    }
  };

  const submit = async () => {
    if (!mediaUri) {
      Alert.alert('No media selected', 'Please select or record a video first.');
      return;
    }

    if (!text.trim()) {
      Alert.alert(
        mediaType === 'video' ? 'Title required' : 'Caption required',
        mediaType === 'video'
          ? 'Please add a title for your video.'
          : 'Please add a caption for your reel.'
      );
      return;
    }

    try {
      await createMediaPost({
        kind: mediaType,
        mediaUri,
        mimeType,
        title: mediaType === 'video' ? text : undefined,
        caption: mediaType === 'reel' ? text : undefined,
        durationLabel: '0:00',
        soundLabel: 'Original Audio',
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      router.back();
    } catch (error) {
      console.error('Failed to create media post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: mediaType === 'video' ? 'New video' : 'New reel',
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
          headerRight: () => (
            <Pressable
              onPress={submit}
              disabled={!mediaUri || !text.trim() || isCreating}
              style={[
                styles.postBtn,
                {
                  backgroundColor:
                    mediaUri && text.trim() && !isCreating ? colors.primary : colors.secondary,
                },
              ]}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color="#FFFCF5" />
              ) : (
                <Text
                  style={[
                    styles.postBtnText,
                    { color: mediaUri && text.trim() ? '#FFFCF5' : colors.mutedForeground },
                  ]}
                >
                  Post
                </Text>
              )}
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.body}>
          <Avatar name={user?.name || 'User'} color={user?.accentColor || '#6366f1'} size={44} />
          <View style={styles.content}>
            <View style={styles.typeToggle}>
              <Pressable
                style={[
                  styles.typeBtn,
                  { backgroundColor: mediaType === 'video' ? colors.primary : colors.secondary },
                ]}
                onPress={() => setMediaType('video')}
              >
                <Text
                  style={[
                    styles.typeText,
                    { color: mediaType === 'video' ? '#FFFCF5' : colors.mutedForeground },
                  ]}
                >
                  Video
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.typeBtn,
                  { backgroundColor: mediaType === 'reel' ? colors.primary : colors.secondary },
                ]}
                onPress={() => setMediaType('reel')}
              >
                <Text
                  style={[
                    styles.typeText,
                    { color: mediaType === 'reel' ? '#FFFCF5' : colors.mutedForeground },
                  ]}
                >
                  Reel
                </Text>
              </Pressable>
            </View>

            {!mediaUri ? (
              <View style={styles.mediaPicker}>
                <Pressable style={styles.pickerBtn} onPress={pickFromLibrary}>
                  <Feather name="image" size={24} color={colors.foreground} />
                  <Text style={[styles.pickerText, { color: colors.foreground }]}>
                    Pick from library
                  </Text>
                </Pressable>
                <Pressable style={styles.pickerBtn} onPress={recordWithCamera}>
                  <Feather name="video" size={24} color={colors.foreground} />
                  <Text style={[styles.pickerText, { color: colors.foreground }]}>
                    Record with camera
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.mediaPreview}>
                <Image source={{ uri: mediaUri }} style={styles.previewImage} resizeMode="cover" />
                <Pressable style={styles.removeBtn} onPress={() => setMediaUri(null)}>
                  <Feather name="x-circle" size={20} color="#FFFCF5" />
                </Pressable>
              </View>
            )}

            <TextInput
              value={text}
              onChangeText={(v) => setText(v.slice(0, MAX_LENGTH))}
              placeholder={mediaType === 'video' ? 'Video title...' : 'Caption...'}
              placeholderTextColor={colors.mutedForeground}
              multiline
              style={[styles.input, { color: colors.foreground }]}
            />
          </View>
        </View>
        <View style={styles.footer}>
          <Text style={[styles.counter, { color: colors.mutedForeground }]}>
            {text.length}/{MAX_LENGTH}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  body: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  content: {
    flex: 1,
    gap: 12,
  },
  typeToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  typeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  mediaPicker: {
    gap: 8,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  pickerText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  mediaPreview: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    aspectRatio: 16 / 9,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
  },
  input: {
    fontFamily: 'Inter_400Regular',
    fontSize: 17,
    lineHeight: 23,
    paddingTop: 6,
    minHeight: 80,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: 'flex-end',
  },
  counter: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  postBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    marginRight: 4,
  },
  postBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
  },
});
