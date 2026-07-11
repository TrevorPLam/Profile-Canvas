import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

/**
 * Mobile hook for creating comments via backend API
 *
 * This module hides the API call, cache invalidation, and error handling
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

interface CreateCommentVariables {
  postId: string;
  text: string;
}

interface CreateCommentResult {
  comment: CommentResponse;
}

/**
 * Hook for creating comments on a post
 *
 * Handles:
 * - API call to POST /posts/{postId}/comments
 * - Cache invalidation for comments query
 * - Error handling
 * - Loading state
 */
export function useCreateComment() {
  const queryClient = useQueryClient();

  const mutation = useMutation<CreateCommentResult, Error, CreateCommentVariables>({
    mutationFn: async ({ postId, text }: CreateCommentVariables) => {
      const trimmed = text.trim();
      if (!trimmed) {
        throw new Error('Comment text cannot be empty');
      }

      if (!postId) {
        throw new Error('Post ID is required');
      }

      const response = await apiFetch<CommentResponse>(`/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      });

      return { comment: response };
    },
    onSuccess: (data, variables) => {
      // Invalidate comments query for this post to show the new comment
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
      // Invalidate feed queries to update comment count
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['feed', 'recommended'] });
      // Invalidate profile posts to update comment count
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  return {
    createComment: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
}
