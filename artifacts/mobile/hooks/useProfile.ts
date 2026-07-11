import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { UserProfile } from '@/lib/types';

interface BackendProfile {
  userId: string;
  handle: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  wallpaper: string | null;
  accentColor: string;
  moodLabel: string | null;
  moodIcon: string | null;
  nowPlaying: string | null;
  moduleSettings: {
    modules: Array<{
      id: string;
      visible: boolean;
      visibility: 'everyone' | 'friends' | 'onlyMe';
      order: number;
    }>;
  };
  joinedAt: string;
  topFriendIds: string[];
  friendCount: number;
}

function backendToMobileProfile(backend: BackendProfile): UserProfile {
  return {
    id: backend.userId,
    handle: backend.handle,
    name: backend.name,
    bio: backend.bio ?? '',
    avatarColor: '#6366f1', // Default color since backend doesn't have this
    avatarUrl: backend.avatarUrl,
    wallpaper: backend.wallpaper ?? 'default',
    accentColor: backend.accentColor,
    moodLabel: backend.moodLabel,
    moodIcon: backend.moodIcon,
    nowPlaying: backend.nowPlaying,
    joinedLabel: new Date(backend.joinedAt).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    }),
    topFriendIds: backend.topFriendIds ?? [],
    friendCount: backend.friendCount ?? 0,
    modules: backend.moduleSettings.modules.map((m) => ({
      id: m.id as 'about' | 'topFriends' | 'mood' | 'posts',
      visible: m.visible,
      visibility: m.visibility,
      order: m.order,
    })),
  };
}

/**
 * Fetch the authenticated user's profile
 */
export function useMyProfile() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: async (): Promise<UserProfile> => {
      const response = await apiFetch<{ profile: BackendProfile }>('/profiles/me');
      return backendToMobileProfile(response.profile);
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch a profile by handle
 */
export function useProfile(handle: string | undefined) {
  return useQuery({
    queryKey: ['profile', handle],
    queryFn: async (): Promise<UserProfile> => {
      const response = await apiFetch<{ profile: BackendProfile }>(`/profiles/${handle}`);
      return backendToMobileProfile(response.profile);
    },
    enabled: !!handle,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
