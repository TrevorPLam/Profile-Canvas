import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface SuggestedProfile {
  userId: string;
  handle: string;
  name: string;
  avatarUrl: string | null;
}

interface PeopleSuggestionsResponse {
  suggestions: SuggestedProfile[];
  total: number;
}

/**
 * Query to fetch people suggestions (people you may know)
 */
export function usePeopleSuggestions() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['discover', 'people'],
    queryFn: async (): Promise<PeopleSuggestionsResponse> => {
      const response = await apiFetch<PeopleSuggestionsResponse>('/discover/people');
      return response;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
