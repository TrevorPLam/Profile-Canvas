import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  album: string | null;
  spotifyId: string | null;
  appleMusicId: string | null;
  appleMusic: string | null;
}

interface MusicSearchResponse {
  tracks: MusicTrack[];
}

export function useMusicSearch(query: string) {
  return useQuery({
    queryKey: ['music', 'search', query],
    queryFn: async (): Promise<MusicSearchResponse> => {
      const response = await apiFetch<MusicSearchResponse>(
        `/music/search?q=${encodeURIComponent(query)}`
      );
      return response;
    },
    enabled: query.length > 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
