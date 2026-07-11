import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const SESSION_KEY = 'corkboard.session.v1';

interface UserProfile {
  userId: string;
  email: string;
  handle: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  wallpaper: string | null;
  accentColor: string;
  moodLabel: string | null;
  moodIcon: string | null;
  nowPlaying: string | null;
  moduleSettings: unknown;
  joinedAt: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  user: UserProfile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from AsyncStorage on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const sessionJson = await AsyncStorage.getItem(SESSION_KEY);
        if (sessionJson && mounted) {
          const session = JSON.parse(sessionJson) as UserProfile;
          setUser(session);
        }
      } catch (error) {
        console.error('Failed to load session:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Persist session to AsyncStorage
  const persistSession = useCallback(async (session: UserProfile | null) => {
    try {
      if (session) {
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } else {
        await AsyncStorage.removeItem(SESSION_KEY);
      }
    } catch (error) {
      console.error('Failed to persist session:', error);
    }
  }, []);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const response = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      return response;
    },
    onSuccess: async (data) => {
      setUser(data.user);
      await persistSession(data.user);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterRequest) => {
      const response = await apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      return response;
    },
    onSuccess: async (data) => {
      setUser(data.user);
      await persistSession(data.user);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiFetch('/auth/logout', { method: 'POST' });
    },
    onSuccess: async () => {
      setUser(null);
      await persistSession(null);
      queryClient.clear();
    },
  });

  // Refresh session mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await apiFetch<AuthResponse>('/auth/refresh', {
        method: 'POST',
      });
      return response;
    },
    onSuccess: async (data) => {
      setUser(data.user);
      await persistSession(data.user);
    },
    onError: async () => {
      // Session is invalid, clear it
      setUser(null);
      await persistSession(null);
    },
  });

  const login = useCallback(
    async (email: string, password: string) => {
      await loginMutation.mutateAsync({ email, password });
    },
    [loginMutation]
  );

  const register = useCallback(
    async (email: string, password: string) => {
      await registerMutation.mutateAsync({ email, password });
    },
    [registerMutation]
  );

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const refreshSession = useCallback(async () => {
    await refreshMutation.mutateAsync();
  }, [refreshMutation]);

  const value: AuthContextValue = {
    user,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending || logoutMutation.isPending,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
