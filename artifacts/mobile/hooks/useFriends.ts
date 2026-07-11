import { useQuery } from '@tanstack/react-query';
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

interface TopFriendWithProfile {
  id: string;
  friendId: string;
  order: number;
  addedAt: string;
  removedAt: string | null;
  friend: {
    userId: string;
    handle: string;
    name: string;
    avatarUrl: string | null;
  };
}

interface TopFriendsResponse {
  topFriends: TopFriendWithProfile[];
}

interface TopFriendsHistoryResponse {
  userId: string;
  currentTopFriends: TopFriendWithProfile[];
  history: TopFriendWithProfile[];
}

/**
 * Query to fetch the current user's top friends
 */
export function useTopFriends() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['top-friends'],
    queryFn: async (): Promise<TopFriendsResponse> => {
      const response = await apiFetch<TopFriendsResponse>('/top-friends');
      return response;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Query to fetch the current user's top friends history
 */
export function useTopFriendsHistory() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['top-friends', 'history'],
    queryFn: async (): Promise<TopFriendsHistoryResponse> => {
      const response = await apiFetch<TopFriendsHistoryResponse>('/top-friends/history');
      return response;
    },
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
