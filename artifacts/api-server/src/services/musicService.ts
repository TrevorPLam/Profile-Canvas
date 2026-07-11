/**
 * MusicService encapsulates music integration business logic.
 *
 * Deep module: Hides external music service integration, caching, and rate limiting
 * behind a simple interface of domain operations.
 *
 * Design decisions:
 * - Supports multiple music providers (Spotify, Apple Music, ISRC)
 * - Caches search results to reduce API calls and respect rate limits
 * - Stores only track IDs and metadata, not audio files
 * - Generates music cards with deep links to streaming platforms
 * - Rate limiting to respect external API quotas
 */

export type MusicProvider = 'spotify' | 'appleMusic' | 'isrc';

export interface MusicTrack {
  trackId: string;
  title: string;
  artist: string;
  album: string;
  durationMs?: number;
  artworkUrl?: string;
  releaseDate?: string;
  externalIds?: {
    isrc?: string;
    spotifyId?: string;
    appleMusicId?: string;
  };
  externalUrls?: {
    spotify?: string;
    appleMusic?: string;
  };
}

export interface MusicSearchRequest {
  query: string;
  limit?: number;
  offset?: number;
}

export interface MusicSearchResponse {
  tracks: MusicTrack[];
  total: number;
  limit: number;
  offset: number;
}

export interface MusicShareRequest {
  trackId: string;
  provider: MusicProvider;
}

export interface MusicShareResponse {
  id: string;
  track: MusicTrack;
  createdAt: string;
}

/**
 * Simple in-memory cache for search results
 * In production, this should use Redis or similar
 */
class SearchCache {
  private cache = new Map<string, { data: MusicSearchResponse; expiresAt: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, value: MusicSearchResponse): void {
    this.cache.set(key, {
      data: value,
      expiresAt: Date.now() + this.TTL,
    });
  }

  get(key: string): MusicSearchResponse | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * MusicService handles music search and sharing operations.
 *
 * This is a stub implementation that can be extended with actual
 * Spotify/Apple Music API integrations. The current implementation
 * returns mock data for development purposes.
 */
export class MusicService {
  private cache = new SearchCache();
  private rateLimitWindow = new Map<string, number[]>();
  private readonly RATE_LIMIT = 30; // requests per minute
  private readonly RATE_WINDOW = 60 * 1000; // 1 minute

  /**
   * Search for music tracks
   * @param request - The search request with query and pagination
   * @returns Search results with track metadata
   */
  async search(request: MusicSearchRequest): Promise<MusicSearchResponse> {
    // Check cache first
    const cacheKey = `${request.query}:${request.limit || 10}:${request.offset || 0}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Rate limiting
    await this.checkRateLimit('search');

    // Stub implementation - in production, integrate with Spotify/Apple Music APIs
    // For now, return mock data to satisfy the API contract
    const mockTracks = this.getMockTracks(request.query, request.limit || 10);

    const response: MusicSearchResponse = {
      tracks: mockTracks,
      total: mockTracks.length,
      limit: request.limit || 10,
      offset: request.offset || 0,
    };

    // Cache the result
    this.cache.set(cacheKey, response);

    return response;
  }

  /**
   * Share a music track (generate a music card)
   * @param request - The share request with track ID and provider
   * @returns Music share response with track metadata
   */
  async share(request: MusicShareRequest): Promise<MusicShareResponse> {
    // Rate limiting
    await this.checkRateLimit('share');

    // Stub implementation - in production, fetch track details from external API
    const track = this.getMockTrack(request.trackId, request.provider);

    return {
      id: crypto.randomUUID(),
      track,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Get track details by ID
   * @param trackId - The track ID
   * @param provider - The music provider
   * @returns Track metadata
   */
  async getTrack(trackId: string, provider: MusicProvider): Promise<MusicTrack> {
    // Rate limiting
    await this.checkRateLimit('getTrack');

    // Stub implementation
    return this.getMockTrack(trackId, provider);
  }

  /**
   * Check rate limits for a given operation
   * @param operation - The operation name
   */
  private async checkRateLimit(operation: string): Promise<void> {
    const now = Date.now();
    const timestamps = this.rateLimitWindow.get(operation) || [];

    // Remove timestamps outside the rate window
    const validTimestamps = timestamps.filter((t) => now - t < this.RATE_WINDOW);

    if (validTimestamps.length >= this.RATE_LIMIT) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    validTimestamps.push(now);
    this.rateLimitWindow.set(operation, validTimestamps);
  }

  /**
   * Generate mock track data for development
   * In production, this would be replaced with actual API calls
   */
  private getMockTracks(_query: string, _limit: number): MusicTrack[] {
    // Return empty array for now - this is a stub
    // In production, integrate with Spotify Web API or Apple Music API
    return [];
  }

  /**
   * Generate mock track data for development
   * In production, this would be replaced with actual API calls
   */
  private getMockTrack(trackId: string, provider: MusicProvider): MusicTrack {
    // Return a stub track - this is a placeholder
    // In production, fetch from Spotify/Apple Music API
    return {
      trackId,
      title: 'Mock Track',
      artist: 'Mock Artist',
      album: 'Mock Album',
      durationMs: 180000,
      artworkUrl: 'https://example.com/artwork.jpg',
      releaseDate: '2024-01-01',
      externalIds: {
        isrc: trackId,
        spotifyId: provider === 'spotify' ? trackId : undefined,
        appleMusicId: provider === 'appleMusic' ? trackId : undefined,
      },
      externalUrls: {
        spotify: provider === 'spotify' ? `https://open.spotify.com/track/${trackId}` : undefined,
        appleMusic: provider === 'appleMusic' ? `https://music.apple.com/album/${trackId}` : undefined,
      },
    };
  }

  /**
   * Clear the search cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear the rate limit window (useful for testing)
   */
  clearRateLimit(): void {
    this.rateLimitWindow.clear();
  }
}

// Export a singleton instance for convenience
export const musicService = new MusicService();
