import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { apiFetch } from '@/lib/api';

/**
 * Mobile hook for creating media posts via backend API
 *
 * This module hides the upload-then-create sequence, progress state,
 * and error handling behind a simple domain interface following the
 * deep module philosophy.
 */

interface MediaUploadResponse {
  url: string;
  mediaId: string;
  mimeType: string;
  sizeBytes: number;
}

interface PostResponse {
  id: string;
  authorId: string;
  kind: string;
  text: string | null;
  title: string | null;
  caption: string | null;
  thumbnailUrl: string | null;
  durationLabel: string | null;
  viewsLabel: string | null;
  soundLabel: string | null;
  topics: string[] | null;
  createdAt: string;
  updatedAt: string;
}

interface VideoPostContent {
  kind: 'video';
  title: string;
  thumbnailUrl: string;
  durationLabel: string;
  viewsLabel: string;
}

interface ReelPostContent {
  kind: 'reel';
  caption: string;
  thumbnailUrl: string;
  soundLabel: string;
  viewsLabel: string;
}

interface CreateMediaPostVariables {
  kind: 'video' | 'reel';
  mediaUri: string;
  mimeType: string;
  title?: string;
  caption?: string;
  durationLabel?: string;
  soundLabel?: string;
}

interface CreateMediaPostResult {
  post: PostResponse;
}

/**
 * Upload media file to backend
 */
async function uploadMedia(uri: string, mimeType: string): Promise<MediaUploadResponse> {
  const formData = new FormData();
  formData.append('file', {
    uri,
    type: mimeType,
    name: `upload.${mimeType.split('/')[1]}`,
  } as any);

  const response = await apiFetch<MediaUploadResponse>('/media/upload', {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response;
}

/**
 * Hook for creating media posts (video or reel)
 *
 * Handles:
 * - Media upload to POST /media/upload
 * - Post creation to POST /posts with media URL
 * - Cache invalidation for feed and profile queries
 * - Error handling
 * - Loading state
 */
export function useCreateMediaPost() {
  const queryClient = useQueryClient();

  const mutation = useMutation<CreateMediaPostResult, Error, CreateMediaPostVariables>({
    mutationFn: async ({
      kind,
      mediaUri,
      mimeType,
      title,
      caption,
      durationLabel,
      soundLabel,
    }: CreateMediaPostVariables) => {
      // Step 1: Upload media
      const mediaUpload = await uploadMedia(mediaUri, mimeType);

      // Step 2: Create post with media URL
      let requestBody: VideoPostContent | ReelPostContent;

      if (kind === 'video') {
        requestBody = {
          kind: 'video',
          title: title || '',
          thumbnailUrl: mediaUpload.url,
          durationLabel: durationLabel || '0:00',
          viewsLabel: '0 views',
        };
      } else {
        requestBody = {
          kind: 'reel',
          caption: caption || '',
          thumbnailUrl: mediaUpload.url,
          soundLabel: soundLabel || 'Original Audio',
          viewsLabel: '0 views',
        };
      }

      const response = await apiFetch<PostResponse>('/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      return { post: response };
    },
    onSuccess: () => {
      // Invalidate feed queries to show the new post
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['feed', 'recommended'] });
      // Invalidate profile posts to show the new post
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      // Invalidate discover queries
      queryClient.invalidateQueries({ queryKey: ['discover'] });
      // Invalidate reels queries
      queryClient.invalidateQueries({ queryKey: ['reels'] });
    },
  });

  return {
    createMediaPost: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Helper to pick video from library
 */
export async function pickVideo(): Promise<{ uri: string; mimeType: string } | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['videos'],
    allowsEditing: false,
    quality: 1,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: asset.mimeType || 'video/mp4',
  };
}

/**
 * Helper to record video with camera
 */
export async function recordVideo(): Promise<{ uri: string; mimeType: string } | null> {
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['videos'],
    allowsEditing: false,
    quality: 1,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: asset.mimeType || 'video/mp4',
  };
}
