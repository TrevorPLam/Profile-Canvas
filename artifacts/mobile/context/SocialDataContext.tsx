import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ME_ID,
  createSeedFriendRequests,
  createSeedPosts,
  createSeedProfiles,
} from '@/lib/mockData';
import type { FriendRequest, ModuleId, Post, UserProfile, Visibility } from '@/lib/types';

interface StoredState {
  profiles: Record<string, UserProfile>;
  posts: Post[];
  friendIds: string[];
  requests: FriendRequest[];
}

const STORAGE_KEY = 'corkboard.social.v1';

interface SocialDataContextValue {
  ready: boolean;
  me: UserProfile;
  profiles: Record<string, UserProfile>;
  posts: Post[];
  friendIds: string[];
  requests: FriendRequest[];
  getProfile: (id: string) => UserProfile | undefined;
  isFriend: (id: string) => boolean;
  toggleLike: (postId: string) => void;
  addTextPost: (text: string) => void;
  updateMyProfile: (patch: Partial<UserProfile>) => void;
  setModuleVisible: (moduleId: ModuleId, visible: boolean) => void;
  setModuleAudience: (moduleId: ModuleId, visibility: Visibility) => void;
  reorderModule: (moduleId: ModuleId, direction: -1 | 1) => void;
  setTopFriends: (ids: string[]) => void;
  sendFriendRequest: (id: string) => void;
  acceptFriendRequest: (requestId: string) => void;
  declineFriendRequest: (requestId: string) => void;
  removeFriend: (id: string) => void;
}

const SocialDataContext = createContext<SocialDataContextValue | undefined>(undefined);

export function SocialDataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoredState | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as StoredState;
          if (mounted) {
            setState(parsed);
            setReady(true);
          }
          return;
        }
      } catch {
        // fall through to seed
      }
      const now = Date.now();
      const seeded: StoredState = {
        profiles: createSeedProfiles(now),
        posts: createSeedPosts(now),
        friendIds: ['u1', 'u2', 'u3'],
        requests: createSeedFriendRequests(now),
      };
      if (mounted) {
        setState(seeded);
        setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const persist = useCallback((next: StoredState) => {
    setState(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const value = useMemo<SocialDataContextValue | undefined>(() => {
    if (!state) return undefined;

    const me = state.profiles[ME_ID]!;

    const getProfile = (id: string) => state.profiles[id];
    const isFriend = (id: string) => state.friendIds.includes(id);

    const toggleLike = (postId: string) => {
      const posts = state.posts.map((p) =>
        p.id === postId
          ? { ...p, likedByMe: !p.likedByMe, likeCount: p.likeCount + (p.likedByMe ? -1 : 1) }
          : p,
      );
      persist({ ...state, posts });
    };

    const addTextPost = (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const newPost: Post = {
        id: `local-${Date.now()}`,
        authorId: ME_ID,
        kind: 'text',
        createdAt: Date.now(),
        likeCount: 0,
        commentCount: 0,
        likedByMe: false,
        text: trimmed,
      };
      persist({ ...state, posts: [newPost, ...state.posts] });
    };

    const updateMyProfile = (patch: Partial<UserProfile>) => {
      const profiles = { ...state.profiles, [ME_ID]: { ...me, ...patch } };
      persist({ ...state, profiles });
    };

    const setModuleVisible = (moduleId: ModuleId, visible: boolean) => {
      const modules = me.modules.map((m) => (m.id === moduleId ? { ...m, visible } : m));
      updateMyProfile({ modules });
    };

    const setModuleAudience = (moduleId: ModuleId, visibility: Visibility) => {
      const modules = me.modules.map((m) => (m.id === moduleId ? { ...m, visibility } : m));
      updateMyProfile({ modules });
    };

    const reorderModule = (moduleId: ModuleId, direction: -1 | 1) => {
      const sorted = [...me.modules].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex((m) => m.id === moduleId);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) return;
      const a = sorted[index]!;
      const b = sorted[targetIndex]!;
      sorted[index] = { ...b, order: a.order };
      sorted[targetIndex] = { ...a, order: b.order };
      updateMyProfile({ modules: sorted });
    };

    const setTopFriends = (ids: string[]) => {
      updateMyProfile({ topFriendIds: ids });
    };

    const sendFriendRequest = (id: string) => {
      if (state.friendIds.includes(id)) return;
      persist({ ...state, friendIds: [...state.friendIds, id] });
    };

    const acceptFriendRequest = (requestId: string) => {
      const request = state.requests.find((r) => r.id === requestId);
      if (!request) return;
      persist({
        ...state,
        friendIds: [...state.friendIds, request.fromUserId],
        requests: state.requests.filter((r) => r.id !== requestId),
      });
    };

    const declineFriendRequest = (requestId: string) => {
      persist({ ...state, requests: state.requests.filter((r) => r.id !== requestId) });
    };

    const removeFriend = (id: string) => {
      persist({
        ...state,
        friendIds: state.friendIds.filter((f) => f !== id),
        profiles: {
          ...state.profiles,
          [ME_ID]: { ...me, topFriendIds: me.topFriendIds.filter((f) => f !== id) },
        },
      });
    };

    return {
      ready: true,
      me,
      profiles: state.profiles,
      posts: state.posts,
      friendIds: state.friendIds,
      requests: state.requests,
      getProfile,
      isFriend,
      toggleLike,
      addTextPost,
      updateMyProfile,
      setModuleVisible,
      setModuleAudience,
      reorderModule,
      setTopFriends,
      sendFriendRequest,
      acceptFriendRequest,
      declineFriendRequest,
      removeFriend,
    };
  }, [state, persist]);

  if (!value) {
    return null;
  }

  return <SocialDataContext.Provider value={value}>{children}</SocialDataContext.Provider>;
}

export function useSocialData(): SocialDataContextValue {
  const ctx = useContext(SocialDataContext);
  if (!ctx) {
    throw new Error('useSocialData must be used within SocialDataProvider');
  }
  return ctx;
}
