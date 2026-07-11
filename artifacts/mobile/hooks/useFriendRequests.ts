import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface FriendRequest {
  id: string;
  senderId: string;
  senderHandle: string;
  senderName: string;
  senderAvatarUrl: string | null;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt: string;
}

interface FriendRequestListResponse {
  requests: FriendRequest[];
  total: number;
}

/**
 * Query to fetch incoming friend requests
 */
export function useIncomingFriendRequests() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['friends', 'requests', 'incoming'],
    queryFn: async (): Promise<FriendRequestListResponse> => {
      const response = await apiFetch<FriendRequestListResponse>('/friends/requests?type=incoming');
      return response;
    },
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Query to fetch outgoing friend requests
 */
export function useOutgoingFriendRequests() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['friends', 'requests', 'outgoing'],
    queryFn: async (): Promise<FriendRequestListResponse> => {
      const response = await apiFetch<FriendRequestListResponse>('/friends/requests?type=outgoing');
      return response;
    },
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Accept a friend request
 */
export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const response = await apiFetch<{ friendshipId: string }>(`/friends/requests/${requestId}`, {
        method: 'POST',
      });
      return response;
    },
    onSuccess: () => {
      // Invalidate friends list to refresh friendship status
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      // Invalidate friend requests to refresh incoming requests
      queryClient.invalidateQueries({ queryKey: ['friends', 'requests'] });
      // Invalidate profile queries to update friend counts
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

/**
 * Decline a friend request
 */
export function useDeclineFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const response = await apiFetch(`/friends/requests/${requestId}/decline`, {
        method: 'POST',
      });
      return response;
    },
    onSuccess: () => {
      // Invalidate friend requests to refresh incoming requests
      queryClient.invalidateQueries({ queryKey: ['friends', 'requests'] });
    },
  });
}

/**
 * Cancel a friend request
 */
export function useCancelFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const response = await apiFetch(`/friends/requests/${requestId}`, {
        method: 'DELETE',
      });
      return response;
    },
    onSuccess: () => {
      // Invalidate friend requests to refresh outgoing requests
      queryClient.invalidateQueries({ queryKey: ['friends', 'requests'] });
    },
  });
}
