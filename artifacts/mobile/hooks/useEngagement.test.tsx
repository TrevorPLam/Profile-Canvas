import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEngagement } from './useEngagement';

// Mock the API fetch
vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
}));

describe('useEngagement', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should export useEngagement hook', () => {
    const { result } = renderHook(() => useEngagement('post-123'), { wrapper });
    expect(result.current).toBeDefined();
    expect(result.current.toggleLike).toBeInstanceOf(Function);
    expect(result.current.toggleSave).toBeInstanceOf(Function);
    expect(result.current.repost).toBeInstanceOf(Function);
  });

  it('should have loading states', () => {
    const { result } = renderHook(() => useEngagement('post-123'), { wrapper });
    expect(result.current.isLiking).toBe(false);
    expect(result.current.isSaving).toBe(false);
    expect(result.current.isReposting).toBe(false);
  });

  it('should have error state', () => {
    const { result } = renderHook(() => useEngagement('post-123'), { wrapper });
    expect(result.current.error).toBeNull();
  });
});
