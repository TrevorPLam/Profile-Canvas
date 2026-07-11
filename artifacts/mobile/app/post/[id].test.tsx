import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useComments } from '@/hooks/useComments';
import { useCreateComment } from '@/hooks/useCreateComment';

// Mock the apiFetch function
vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
}));

const { apiFetch } = await import('@/lib/api');

describe('useComments', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  it('should fetch comments for a post', async () => {
    const mockComments = {
      comments: [
        {
          id: 'c1',
          postId: 'post1',
          author: {
            userId: 'u1',
            handle: 'user1',
            name: 'User One',
            avatarUrl: null,
          },
          text: 'First comment',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ],
      total: 1,
    };

    vi.mocked(apiFetch).mockResolvedValue(mockComments);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useComments('post1'), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.comments).toEqual(mockComments.comments);
    expect(result.current.total).toBe(1);
    expect(apiFetch).toHaveBeenCalledWith('/posts/post1/comments?limit=20&offset=0');
  });

  it('should handle pagination parameters', async () => {
    const mockComments = { comments: [], total: 0 };
    vi.mocked(apiFetch).mockResolvedValue(mockComments);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useComments('post1', { limit: 50, offset: 10 }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(apiFetch).toHaveBeenCalledWith('/posts/post1/comments?limit=50&offset=10');
  });

  it('should not fetch when postId is undefined', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useComments(undefined), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.comments).toEqual([]);
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    vi.mocked(apiFetch).mockRejectedValue(new Error('Network error'));

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useComments('post1'), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Network error');
  });
});

describe('useCreateComment', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  it('should create a comment successfully', async () => {
    const mockComment = {
      id: 'c1',
      postId: 'post1',
      author: {
        userId: 'u1',
        handle: 'user1',
        name: 'User One',
        avatarUrl: null,
      },
      text: 'New comment',
      createdAt: '2024-01-01T00:00:00Z',
    };

    vi.mocked(apiFetch).mockResolvedValue(mockComment);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCreateComment(), { wrapper });

    await result.current.createComment({ postId: 'post1', text: 'New comment' });

    expect(apiFetch).toHaveBeenCalledWith('/posts/post1/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'New comment' }),
    });

    await waitFor(() => expect(result.current.isCreating).toBe(false));
  });

  it('should reject empty comment text', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCreateComment(), { wrapper });

    await expect(result.current.createComment({ postId: 'post1', text: '   ' })).rejects.toThrow(
      'Comment text cannot be empty'
    );

    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('should reject missing postId', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCreateComment(), { wrapper });

    await expect(result.current.createComment({ postId: '', text: 'Comment' })).rejects.toThrow(
      'Post ID is required'
    );

    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('should invalidate comments query on success', async () => {
    const mockComment = {
      id: 'c1',
      postId: 'post1',
      author: {
        userId: 'u1',
        handle: 'user1',
        name: 'User One',
        avatarUrl: null,
      },
      text: 'New comment',
      createdAt: '2024-01-01T00:00:00Z',
    };

    vi.mocked(apiFetch).mockResolvedValue(mockComment);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCreateComment(), { wrapper });

    await result.current.createComment({ postId: 'post1', text: 'New comment' });

    await waitFor(() => {
      expect(queryClient.getQueryCache().findAll({ queryKey: ['comments', 'post1'] })).toHaveLength(
        0
      );
    });
  });

  it('should handle API errors during creation', async () => {
    vi.mocked(apiFetch).mockRejectedValue(new Error('Failed to create comment'));

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCreateComment(), { wrapper });

    await expect(
      result.current.createComment({ postId: 'post1', text: 'New comment' })
    ).rejects.toThrow('Failed to create comment');

    await waitFor(() => expect(result.current.isCreating).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
