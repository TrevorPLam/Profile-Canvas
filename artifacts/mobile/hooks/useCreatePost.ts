import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

/**
 * Mobile hook for creating posts via backend API
 *
 * This module hides the API call, cache invalidation, and error handling
 * behind a simple domain interface following the deep module philosophy.
 */

interface TextPostContent {
  kind: 'text';
  text: string;
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

interface CreatePostVariables {
  text: string;
}

interface CreatePostResult {
  post: PostResponse;
}

/**
 * Hook for creating text posts
 *
 * Handles:
 * - API call to POST /posts
 * - Cache invalidation for feed and profile queries
 * - Error handling
 * - Loading state
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  const mutation = useMutation<CreatePostResult, Error, CreatePostVariables>({
    mutationFn: async ({ text }: CreatePostVariables) => {
      const trimmed = text.trim();
      if (!trimmed) {
        throw new Error('Post text cannot be empty');
      }

      const requestBody: TextPostContent = {
        kind: 'text',
        text: trimmed,
      };

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
    },
  });

  return {
    createPost: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
}
