import { describe, it, expect, vi } from 'vitest';
import { customFetch } from '@workspace/api-client-react';
import { apiFetch, getApiBaseUrl } from './api';

// Mock the custom-fetch module
vi.mock('@workspace/api-client-react', () => ({
  customFetch: vi.fn(),
  setBaseUrl: vi.fn(),
}));

describe('API Client Configuration', () => {
  describe('getApiBaseUrl', () => {
    it('should return the configured API base URL from environment', () => {
      // The module is initialized at import time with the current env var
      const baseUrl = getApiBaseUrl();
      expect(typeof baseUrl).toBe('string');
      expect(baseUrl).toBeTruthy();
    });
  });

  describe('apiFetch', () => {
    it('should call customFetch with credentials include', async () => {
      const mockResponse = { data: 'test' };
      vi.mocked(customFetch).mockResolvedValue(mockResponse);

      await apiFetch('/test', { method: 'GET' });

      expect(customFetch).toHaveBeenCalledWith('/test', {
        method: 'GET',
        credentials: 'include',
      });
    });

    it('should pass through all options to customFetch', async () => {
      const mockResponse = { data: 'test' };
      vi.mocked(customFetch).mockResolvedValue(mockResponse);

      const options = {
        method: 'POST' as const,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' }),
      };

      await apiFetch('/test', options);

      expect(customFetch).toHaveBeenCalledWith('/test', {
        ...options,
        credentials: 'include',
      });
    });

    it('should return typed response from customFetch', async () => {
      const mockResponse = { id: 1, name: 'test' };
      vi.mocked(customFetch).mockResolvedValue(mockResponse);

      const result = await apiFetch<{ id: number; name: string }>('/test');

      expect(result).toEqual(mockResponse);
    });

    it('should handle customFetch errors', async () => {
      const mockError = new Error('Network error');
      vi.mocked(customFetch).mockRejectedValue(mockError);

      await expect(apiFetch('/test')).rejects.toThrow('Network error');
    });
  });
});
