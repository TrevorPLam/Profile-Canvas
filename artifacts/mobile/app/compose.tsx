import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, Stack } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useCreatePost } from '@/hooks/useCreatePost';
import { useColors } from '@/hooks/useColors';

const MAX_LENGTH = 280;

export default function ComposeScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const { createPost, isCreating } = useCreatePost();
  const [text, setText] = useState('');

  const submit = async () => {
    if (!text.trim()) return;
    try {
      await createPost({ text });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      router.back();
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: 'New post',
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
              disabled={!text.trim() || isCreating}
              style={[
                styles.postBtn,
                { backgroundColor: text.trim() && !isCreating ? colors.primary : colors.secondary },
              ]}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color="#FFFCF5" />
              ) : (
                <Text
                  style={[
                    styles.postBtnText,
                    { color: text.trim() ? '#FFFCF5' : colors.mutedForeground },
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
          <TextInput
            value={text}
            onChangeText={(v) => setText(v.slice(0, MAX_LENGTH))}
            placeholder="What's pinned on your mind?"
            placeholderTextColor={colors.mutedForeground}
            multiline
            autoFocus
            style={[styles.input, { color: colors.foreground }]}
          />
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
  input: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 17,
    lineHeight: 23,
    paddingTop: 6,
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
