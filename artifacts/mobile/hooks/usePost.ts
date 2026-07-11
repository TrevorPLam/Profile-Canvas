import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Post } from '@/lib/types';

export function usePost(postId: string) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const response = await apiFetch<{ post: Post }>(`/posts/${postId}`);
      return response.post;
    },
    enabled: !!postId,
  });
}
