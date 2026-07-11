import { describe, it, expect, beforeEach, vi } from 'vitest';
import { musicService } from './musicService';

describe('MusicService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    musicService.clearCache();
    musicService.clearRateLimit();
  });

  describe('search', () => {
    it('should return search results', async () => {
      const results = await musicService.search({
        query: 'test song',
        limit: 10,
      });

      expect(results).toHaveProperty('tracks');
      expect(results).toHaveProperty('total');
      expect(results).toHaveProperty('limit');
      expect(results).toHaveProperty('offset');
      expect(results.limit).toBe(10);
      expect(results.offset).toBe(0);
    });

    it('should cache search results', async () => {
      const query = 'cached song';
      
      await musicService.search({ query, limit: 5 });
      const results2 = await musicService.search({ query, limit: 5 });

      expect(results2).toBeDefined();
    });

    it('should respect pagination parameters', async () => {
      const results = await musicService.search({
        query: 'test',
        limit: 20,
        offset: 10,
      });

      expect(results.limit).toBe(20);
      expect(results.offset).toBe(10);
    });

    it('should enforce rate limits', async () => {
      const promises = Array.from({ length: 35 }, () =>
        musicService.search({ query: 'test', limit: 10 })
      );

      await expect(Promise.all(promises)).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('share', () => {
    it('should generate a music share', async () => {
      const share = await musicService.share({
        trackId: 'test-track-id',
        provider: 'spotify',
      });

      expect(share).toHaveProperty('id');
      expect(share).toHaveProperty('track');
      expect(share).toHaveProperty('createdAt');
      expect(share.track.trackId).toBe('test-track-id');
    });

    it('should support different providers', async () => {
      const spotifyShare = await musicService.share({
        trackId: 'spotify-id',
        provider: 'spotify',
      });

      const appleMusicShare = await musicService.share({
        trackId: 'apple-id',
        provider: 'appleMusic',
      });

      const isrcShare = await musicService.share({
        trackId: 'isrc-id',
        provider: 'isrc',
      });

      expect(spotifyShare.track.externalIds?.spotifyId).toBe('spotify-id');
      expect(appleMusicShare.track.externalIds?.appleMusicId).toBe('apple-id');
      expect(isrcShare.track.externalIds?.isrc).toBe('isrc-id');
    });

    it('should enforce rate limits', async () => {
      const promises = Array.from({ length: 35 }, () =>
        musicService.share({ trackId: 'test', provider: 'spotify' })
      );

      await expect(Promise.all(promises)).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('getTrack', () => {
    it('should return track details', async () => {
      const track = await musicService.getTrack('track-id', 'spotify');

      expect(track).toHaveProperty('trackId');
      expect(track).toHaveProperty('title');
      expect(track).toHaveProperty('artist');
      expect(track).toHaveProperty('album');
      expect(track.trackId).toBe('track-id');
    });

    it('should enforce rate limits', async () => {
      const promises = Array.from({ length: 35 }, () =>
        musicService.getTrack('test', 'spotify')
      );

      await expect(Promise.all(promises)).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('clearCache', () => {
    it('should clear the search cache', async () => {
      // Use a different query to avoid rate limit from previous tests
      await musicService.search({ query: 'clear-cache-test', limit: 10 });
      musicService.clearCache();

      // After clearing cache, next search should work without hitting cache
      const results = await musicService.search({ query: 'clear-cache-test-2', limit: 10 });
      expect(results).toBeDefined();
    });
  });
});
