import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

interface ProfileUpdateRequest {
  name?: string;
  bio?: string;
  wallpaper?: string;
  accentColor?: string;
  moodLabel?: string | null;
  moodIcon?: string | null;
  nowPlaying?: string | null;
  moduleSettings?: {
    modules: Array<{
      id: string;
      visible: boolean;
      visibility: 'everyone' | 'friends' | 'onlyMe';
      order: number;
    }>;
  };
}

/**
 * Update the authenticated user's profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: ProfileUpdateRequest) => {
      const response = await apiFetch<{ profile: unknown }>('/profiles/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      return response;
    },
    onSuccess: () => {
      // Invalidate the profile query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    },
  });
}

/**
 * Update the authenticated user's top friends
 */
export function useUpdateTopFriends() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (topFriendIds: string[]) => {
      const response = await apiFetch<{ topFriends: unknown }>('/top-friends', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topFriendIds }),
      });
      return response;
    },
    onSuccess: () => {
      // Invalidate the top friends query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['top-friends'] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    },
  });
}
