import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface FriendProfile {
  userId: string;
  handle: string;
  name: string;
  avatarUrl: string | null;
}

interface FriendListResponse {
  friends: FriendProfile[];
  total: number;
}

/**
 * Query to fetch the current user's friends list
 */
export function useFriends() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['friends', 'list'],
    queryFn: async (): Promise<FriendListResponse> => {
      const response = await apiFetch<FriendListResponse>('/friends');
      return response;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Query to fetch the current user's top friends
 */
export function useTopFriends() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['profile', 'me', 'top-friends'],
    queryFn: async (): Promise<{ topFriendIds: string[] }> => {
      const response = await apiFetch<{ topFriendIds: string[] }>('/profiles/me/top-friends');
      return response;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
