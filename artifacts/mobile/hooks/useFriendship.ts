import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface SendFriendRequestRequest {
  targetUserId: string;
}

interface RemoveFriendRequest {
  friendUserId: string;
}

interface FriendListResponse {
  friends: Array<{
    userId: string;
    handle: string;
    name: string;
    avatarUrl: string | null;
  }>;
  total: number;
}

/**
 * Query to check if the current user is friends with a specific user
 */
export function useIsFriend(targetUserId: string | undefined) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['friends', 'list'],
    queryFn: async (): Promise<FriendListResponse> => {
      const response = await apiFetch<FriendListResponse>('/friends');
      return response;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => {
      if (!targetUserId) return false;
      return data.friends.some((friend) => friend.userId === targetUserId);
    },
  });
}

/**
 * Send a friend request to a user
 */
export function useSendFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      const response = await apiFetch<{ requestId: string }>('/friends/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId } as SendFriendRequestRequest),
      });
      return response;
    },
    onSuccess: () => {
      // Invalidate friends list to refresh friendship status
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      // Invalidate friend requests to refresh outgoing requests
      queryClient.invalidateQueries({ queryKey: ['friends', 'requests'] });
    },
  });
}

/**
 * Remove a friend
 */
export function useRemoveFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friendUserId: string) => {
      const response = await apiFetch<{ success: boolean }>('/friends', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendUserId } as RemoveFriendRequest),
      });
      return response;
    },
    onSuccess: () => {
      // Invalidate friends list to refresh friendship status
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      // Invalidate friend requests to refresh requests
      queryClient.invalidateQueries({ queryKey: ['friends', 'requests'] });
      // Invalidate profile queries to update friend counts
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
