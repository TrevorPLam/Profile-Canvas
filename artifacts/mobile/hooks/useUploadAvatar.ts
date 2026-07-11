import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { apiFetch } from '@/lib/api';

/**
 * Mobile hook for uploading avatar images via backend API
 *
 * This module hides the image picker, file upload, cache invalidation, and error handling
 * behind a simple domain interface following the deep module philosophy.
 */

interface MediaUploadResponse {
  url: string;
  mediaId: string;
  mimeType: string;
  sizeBytes: number;
}

interface UploadAvatarVariables {
  uri: string;
  type: string;
  name: string;
}

interface UploadAvatarResult {
  url: string;
}

/**
 * Hook for uploading avatar images
 *
 * Handles:
 * - Image picker permissions and selection
 * - File upload via POST /media/upload
 * - Profile update with new avatar URL
 * - Cache invalidation for profile queries
 * - Error handling
 */
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  const uploadMutation = useMutation<UploadAvatarResult, Error, UploadAvatarVariables>({
    mutationFn: async ({ uri, type, name }: UploadAvatarVariables) => {
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('file', {
        uri,
        type,
        name,
      } as unknown as Blob);

      const response = await apiFetch<MediaUploadResponse>('/media/upload', {
        method: 'POST',
        body: formData as unknown as BodyInit,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return { url: response.url };
    },
    onSuccess: () => {
      // Update profile with new avatar URL
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const pickAndUploadAvatar = async () => {
    // Request media library permissions
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Permission to access the media library is required.');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    if (!asset) {
      return;
    }

    // Validate file size (5MB max for avatars)
    const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
    if (asset.fileSize && asset.fileSize > MAX_AVATAR_SIZE) {
      Alert.alert('File too large', 'Avatar images must be smaller than 5MB.');
      return;
    }

    // Extract file info for upload
    const uri = asset.uri;
    const type = asset.mimeType || 'image/jpeg';
    const name = asset.fileName || `avatar_${Date.now()}.jpg`;

    try {
      const result = await uploadMutation.mutateAsync({ uri, type, name });
      return result.url;
    } catch (error) {
      Alert.alert('Upload failed', 'Failed to upload avatar. Please try again.');
      throw error;
    }
  };

  return {
    pickAndUploadAvatar,
    isUploading: uploadMutation.isPending,
    error: uploadMutation.error,
  };
}
