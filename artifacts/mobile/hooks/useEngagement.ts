import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

/**
 * Mobile hook for post engagement (likes, saves, reposts)
 *
 * This module hides the API calls, optimistic updates, cache invalidation,
 * and error handling behind a simple domain interface following the deep
 * module philosophy.
 */

interface EngagementSummary {
  postId: string;
  likeCount: number;
  saveCount: number;
  repostCount: number;
  viewerHasLiked: boolean;
  viewerHasSaved: boolean;
  viewerHasReposted: boolean;
}

interface EngagementVariables {
  postId: string;
}

interface RepostVariables {
  postId: string;
}

interface RepostResponse {
  post: {
    id: string;
    authorId: string;
    kind: string;
    repostOf?: {
      originalPostId: string;
      originalAuthorId: string;
    };
  };
}

/**
 * Hook for post engagement operations
 *
 * Handles:
 * - Like/unlike with optimistic updates
 * - Save/unsave with optimistic updates
 * - Repost with duplicate prevention
 * - Cache invalidation for feed, posts, and discover queries
 * - Error handling with rollback
 */
export function useEngagement(postId: string) {
  const queryClient = useQueryClient();

  // Like mutation with optimistic update
  const likeMutation = useMutation<EngagementSummary, Error, EngagementVariables, { previousEngagement?: EngagementSummary }>({
    mutationFn: async ({ postId }) => {
      return apiFetch<EngagementSummary>(`/posts/${postId}/like`, {
        method: 'POST',
      });
    },
    onMutate: async ({ postId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['engagement', postId] });

      // Snapshot previous value
      const previousEngagement = queryClient.getQueryData<EngagementSummary>([
        'engagement',
        postId,
      ]);

      // Optimistically update
      queryClient.setQueryData<EngagementSummary>(['engagement', postId], (old) => {
        if (!old) return old;
        return {
          ...old,
          likeCount: old.likeCount + 1,
          viewerHasLiked: true,
        };
      });

      // Return context for rollback
      return { previousEngagement };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousEngagement) {
        queryClient.setQueryData(['engagement', variables.postId], context.previousEngagement);
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['feed', 'recommended'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['discover'] });
    },
  });

  // Unlike mutation with optimistic update
  const unlikeMutation = useMutation<EngagementSummary, Error, EngagementVariables, { previousEngagement?: EngagementSummary }>({
    mutationFn: async ({ postId }) => {
      return apiFetch<EngagementSummary>(`/posts/${postId}/like`, {
        method: 'DELETE',
      });
    },
    onMutate: async ({ postId }) => {
      await queryClient.cancelQueries({ queryKey: ['engagement', postId] });
      const previousEngagement = queryClient.getQueryData<EngagementSummary>([
        'engagement',
        postId,
      ]);

      queryClient.setQueryData<EngagementSummary>(['engagement', postId], (old) => {
        if (!old) return old;
        return {
          ...old,
          likeCount: Math.max(0, old.likeCount - 1),
          viewerHasLiked: false,
        };
      });

      return { previousEngagement };
    },
    onError: (error, variables, context) => {
      if (context?.previousEngagement) {
        queryClient.setQueryData(['engagement', variables.postId], context.previousEngagement);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['feed', 'recommended'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['discover'] });
    },
  });

  // Save mutation with optimistic update
  const saveMutation = useMutation<EngagementSummary, Error, EngagementVariables, { previousEngagement?: EngagementSummary }>({
    mutationFn: async ({ postId }) => {
      return apiFetch<EngagementSummary>(`/posts/${postId}/save`, {
        method: 'POST',
      });
    },
    onMutate: async ({ postId }) => {
      await queryClient.cancelQueries({ queryKey: ['engagement', postId] });
      const previousEngagement = queryClient.getQueryData<EngagementSummary>([
        'engagement',
        postId,
      ]);

      queryClient.setQueryData<EngagementSummary>(['engagement', postId], (old) => {
        if (!old) return old;
        return {
          ...old,
          saveCount: old.saveCount + 1,
          viewerHasSaved: true,
        };
      });

      return { previousEngagement };
    },
    onError: (error, variables, context) => {
      if (context?.previousEngagement) {
        queryClient.setQueryData(['engagement', variables.postId], context.previousEngagement);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['feed', 'recommended'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['discover'] });
    },
  });

  // Unsave mutation with optimistic update
  const unsaveMutation = useMutation<EngagementSummary, Error, EngagementVariables, { previousEngagement?: EngagementSummary }>({
    mutationFn: async ({ postId }) => {
      return apiFetch<EngagementSummary>(`/posts/${postId}/save`, {
        method: 'DELETE',
      });
    },
    onMutate: async ({ postId }) => {
      await queryClient.cancelQueries({ queryKey: ['engagement', postId] });
      const previousEngagement = queryClient.getQueryData<EngagementSummary>([
        'engagement',
        postId,
      ]);

      queryClient.setQueryData<EngagementSummary>(['engagement', postId], (old) => {
        if (!old) return old;
        return {
          ...old,
          saveCount: Math.max(0, old.saveCount - 1),
          viewerHasSaved: false,
        };
      });

      return { previousEngagement };
    },
    onError: (error, variables, context) => {
      if (context?.previousEngagement) {
        queryClient.setQueryData(['engagement', variables.postId], context.previousEngagement);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['feed', 'recommended'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['discover'] });
    },
  });

  // Repost mutation
  const repostMutation = useMutation<RepostResponse, Error, RepostVariables>({
    mutationFn: async ({ postId }) => {
      return apiFetch<RepostResponse>(`/posts/${postId}/repost`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['feed', 'recommended'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['discover'] });
    },
  });

  const toggleLike = () => {
    // Check current state from cache or assume not liked
    const engagement = queryClient.getQueryData<EngagementSummary>(['engagement', postId]);
    const isLiked = engagement?.viewerHasLiked ?? false;

    if (isLiked) {
      unlikeMutation.mutate({ postId });
    } else {
      likeMutation.mutate({ postId });
    }
  };

  const toggleSave = () => {
    const engagement = queryClient.getQueryData<EngagementSummary>(['engagement', postId]);
    const isSaved = engagement?.viewerHasSaved ?? false;

    if (isSaved) {
      unsaveMutation.mutate({ postId });
    } else {
      saveMutation.mutate({ postId });
    }
  };

  const repost = () => {
    repostMutation.mutate({ postId });
  };

  return {
    toggleLike,
    toggleSave,
    repost,
    isLiking: likeMutation.isPending || unlikeMutation.isPending,
    isSaving: saveMutation.isPending || unsaveMutation.isPending,
    isReposting: repostMutation.isPending,
    error: likeMutation.error || unlikeMutation.error || saveMutation.error || unsaveMutation.error || repostMutation.error,
  };
}
