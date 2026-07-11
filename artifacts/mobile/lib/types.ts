import type { ImageSourcePropType } from 'react-native';

export type Visibility = 'everyone' | 'friends' | 'onlyMe';

export type ModuleId = 'about' | 'topFriends' | 'mood' | 'posts';

export interface ProfileModule {
  id: ModuleId;
  visible: boolean;
  visibility: Visibility;
  order: number;
}

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  bio: string;
  avatarColor: string;
  wallpaper: string;
  accentColor: string;
  moodLabel: string | null;
  moodIcon: string | null;
  nowPlaying: string | null;
  joinedLabel: string;
  topFriendIds: string[];
  modules: ProfileModule[];
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  createdAt: number;
}

export type PostKind = 'text' | 'video' | 'reel';

export interface RepostInfo {
  originalPostId: string;
  originalAuthorId: string;
}

interface BasePost {
  id: string;
  authorId: string;
  kind: PostKind;
  createdAt: number;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  repostOf?: RepostInfo;
  topics: string[];
}

export interface TextPost extends BasePost {
  kind: 'text';
  text: string;
}

export interface VideoPost extends BasePost {
  kind: 'video';
  title: string;
  thumbnail: ImageSourcePropType;
  durationLabel: string;
  viewsLabel: string;
}

export interface ReelPost extends BasePost {
  kind: 'reel';
  caption: string;
  thumbnail: ImageSourcePropType;
  soundLabel: string;
  viewsLabel: string;
}

export type Post = TextPost | VideoPost | ReelPost;

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  text: string;
  createdAt: number;
}

export interface WallpaperPreset {
  key: string;
  label: string;
  colors: [string, string];
  textOnWallpaper: string;
}

export interface MoodOption {
  label: string;
  icon: string;
}
