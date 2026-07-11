import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

/**
 * Mobile hook for fetching comments via backend API
 *
 * This module hides the API call, pagination, and error handling
 * behind a simple domain interface following the deep module philosophy.
 */

interface AuthorProfile {
  userId: string;
  handle: string;
  name: string;
  avatarUrl: string | null;
}

interface CommentResponse {
  id: string;
  postId: string;
  author: AuthorProfile;
  text: string;
  createdAt: string;
}

interface CommentListResponse {
  comments: CommentResponse[];
  total: number;
}

interface UseCommentsOptions {
  limit?: number;
  offset?: number;
}

/**
 * Hook for fetching comments for a post
 *
 * Handles:
 * - API call to GET /posts/{postId}/comments
 * - Pagination with limit/offset
 * - Error handling
 * - Loading state
 */
export function useComments(postId: string | undefined, options: UseCommentsOptions = {}) {
  const { limit = 20, offset = 0 } = options;

  const query = useQuery<CommentListResponse, Error>({
    queryKey: ['comments', postId, limit, offset],
    queryFn: async () => {
      if (!postId) {
        throw new Error('Post ID is required');
      }

      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const response = await apiFetch<CommentListResponse>(
        `/posts/${postId}/comments?${params.toString()}`
      );

      return response;
    },
    enabled: !!postId,
    staleTime: 30000, // 30 seconds
  });

  return {
    comments: query.data?.comments ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
