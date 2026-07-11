import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

/**
 * Mobile hook for fetching reels from backend API
 *
 * This module hides the API call, data transformation, and error handling
 * behind a simple domain interface following the deep module philosophy.
 */

interface FeedPost {
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
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  repostOf?: {
    originalPostId: string;
    originalAuthorId: string;
  };
  author: {
    id: string;
    handle: string;
    name: string;
    avatarUrl: string | null;
    accentColor: string;
  };
}

interface FeedResponse {
  posts: FeedPost[];
  total: number;
  limit: number;
  offset: number;
}

interface ReelPost {
  id: string;
  authorId: string;
  kind: 'reel';
  caption: string;
  thumbnailUrl: string;
  soundLabel: string;
  viewsLabel: string;
  createdAt: number;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  repostOf?: {
    originalPostId: string;
    originalAuthorId: string;
  };
  author: {
    id: string;
    handle: string;
    name: string;
    avatarUrl: string | null;
    accentColor: string;
  };
}

/**
 * Transform backend feed post to mobile reel post format
 */
function transformToReelPost(post: FeedPost): ReelPost | null {
  if (post.kind !== 'reel') return null;

  return {
    id: post.id,
    authorId: post.authorId,
    kind: 'reel',
    caption: post.caption || '',
    thumbnailUrl: post.thumbnailUrl || '',
    soundLabel: post.soundLabel || 'Original Audio',
    viewsLabel: post.viewsLabel || '0 views',
    createdAt: new Date(post.createdAt).getTime(),
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    likedByMe: post.likedByMe,
    repostOf: post.repostOf,
    author: post.author,
  };
}

/**
 * Hook for fetching reels from the backend
 *
 * Handles:
 * - API call to GET /feed/recommended (for discovery-style reels)
 * - Filtering for reel posts only
 * - Error handling
 * - Loading state
 */
export function useReels() {
  const query = useQuery<FeedResponse, Error, ReelPost[]>({
    queryKey: ['reels'],
    queryFn: async () => {
      // Use recommended feed for reels (discovery-style content)
      const response = await apiFetch<FeedResponse>('/feed/recommended?limit=50');
      return response;
    },
    select: (data) => {
      // Filter and transform to reel posts
      const reels = data.posts
        .map(transformToReelPost)
        .filter((post): post is ReelPost => post !== null)
        .sort((a, b) => b.createdAt - a.createdAt);
      return reels;
    },
  });

  return {
    reels: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
