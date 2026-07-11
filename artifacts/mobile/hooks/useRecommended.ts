import { useInfiniteQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Post, UserProfile } from '@/lib/types';

/**
 * Mobile hook for fetching recommended feed from backend API
 *
 * This module hides the API call, data transformation, and pagination logic
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
  engagement: {
    likeCount: number;
    saveCount: number;
    repostCount: number;
    viewerHasLiked: boolean;
    viewerHasSaved: boolean;
    viewerHasReposted: boolean;
  };
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

/**
 * Transform backend feed post to mobile post format
 */
function transformToPost(post: FeedPost): Post {
  const base = {
    id: post.id,
    authorId: post.authorId,
    kind: post.kind as 'text' | 'video' | 'reel',
    createdAt: new Date(post.createdAt).getTime(),
    likeCount: post.engagement.likeCount,
    commentCount: 0, // Not included in FeedPost, will be fetched separately if needed
    likedByMe: post.engagement.viewerHasLiked,
    repostOf: post.repostOf,
    topics: post.topics || [],
  };

  if (post.kind === 'text') {
    return {
      ...base,
      kind: 'text',
      text: post.text || '',
    };
  }

  if (post.kind === 'video') {
    return {
      ...base,
      kind: 'video',
      title: post.title || '',
      thumbnail: { uri: post.thumbnailUrl || '' },
      durationLabel: post.durationLabel || '',
      viewsLabel: post.viewsLabel || '',
    };
  }

  // reel
  return {
    ...base,
    kind: 'reel',
    caption: post.caption || '',
    thumbnail: { uri: post.thumbnailUrl || '' },
    soundLabel: post.soundLabel || 'Original Audio',
    viewsLabel: post.viewsLabel || '',
  };
}

/**
 * Transform backend author to mobile author profile format
 */
function transformToAuthor(author: FeedPost['author']): UserProfile {
  return {
    id: author.id,
    name: author.name,
    handle: author.handle,
    bio: '',
    avatarColor: author.accentColor,
    avatarUrl: author.avatarUrl,
    wallpaper: '',
    accentColor: author.accentColor,
    moodLabel: null,
    moodIcon: null,
    nowPlaying: null,
    joinedLabel: '',
    topFriendIds: [],
    friendCount: 0,
    modules: [],
  };
}

/**
 * Hook for fetching the recommended feed (non-friends ranked by engagement)
 *
 * Handles:
 * - API call to GET /feed/recommended with pagination
 * - Data transformation to mobile format
 * - Infinite scroll pagination
 * - Error handling
 * - Loading states
 */
export function useRecommended() {
  const query = useInfiniteQuery<FeedResponse, Error, { posts: Post[]; profiles: Record<string, UserProfile> }>({
    queryKey: ['feed', 'recommended'],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await apiFetch<FeedResponse>(`/feed/recommended?limit=20&offset=${pageParam}`);
      return response;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.offset + lastPage.limit >= lastPage.total) {
        return undefined; // No more pages
      }
      return lastPage.offset + lastPage.limit;
    },
    select: (data) => {
      // Flatten and transform all pages
      const allPosts = data.pages.flatMap((page) => page.posts.map(transformToPost));
      const profiles: Record<string, UserProfile> = {};
      
      data.pages.forEach((page) => {
        page.posts.forEach((post) => {
          profiles[post.authorId] = transformToAuthor(post.author);
        });
      });

      return { posts: allPosts, profiles };
    },
  });

  return {
    posts: query.data?.posts || [],
    profiles: query.data?.profiles || {},
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    error: query.error,
    refetch: query.refetch,
  };
}
