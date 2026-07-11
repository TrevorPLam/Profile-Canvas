# Mobile Developer Guide

This guide describes the Corkboard mobile application architecture, screen map, and development patterns.

## Application Structure

The mobile app is built with Expo (React Native) using expo-router for file-based routing.

### Directory Structure

```
artifacts/mobile/
├── app/                    # expo-router screens
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Feed tab
│   │   ├── reels.tsx      # Reels tab
│   │   ├── discover.tsx   # Discover tab
│   │   └── profile.tsx    # Profile tab (own profile)
│   ├── profile/           # Profile detail screens
│   │   └── [id].tsx       # Other user's profile
│   ├── post/              # Post detail screens
│   │   └── [id].tsx       # Post detail with comments
│   ├── compose.tsx        # Compose new post modal
│   ├── compose-media.tsx  # Compose media post modal
│   ├── edit-profile.tsx   # Edit profile modal
│   ├── friends-list.tsx   # Friend management screen
│   ├── login.tsx          # Login screen
│   ├── notifications.tsx  # Notifications screen
│   ├── _layout.tsx        # Root layout
│   └── +not-found.tsx     # 404 screen
├── context/               # React contexts
│   └── SocialDataContext.tsx  # Social data state management
├── lib/                   # Utilities and domain logic
│   ├── types.ts           # TypeScript domain types
│   ├── theme.ts           # Styling system (wallpapers, accents, moods)
│   ├── modules.ts         # Profile module visibility logic
│   ├── mockData.ts        # Seed data for development
│   └── topics.ts          # Topic inference logic
├── constants/             # Constants
│   └── colors.ts          # Color palette
└── assets/                # Static assets
```

## Screen Map

### Tab Navigation

#### Feed Tab (`app/(tabs)/index.tsx`)

- **Purpose:** Main content feed showing posts from all users
- **Features:**
  - Posts from all users (discover-style)
  - Friends icon with pending request badge in header
  - Like, comment, repost, save actions
  - Topic chips on posts
- **API Endpoints:**
  - `GET /posts` - List posts
  - `GET /posts/:id` - Get post details
  - `POST /posts/:postId/like` - Like post
  - `DELETE /posts/:postId/like` - Unlike post
  - `POST /posts/:postId/repost` - Repost post
  - `DELETE /posts/:postId/repost` - Remove repost
  - `POST /posts/:postId/save` - Save post
  - `DELETE /posts/:postId/save` - Unsave post
- **Current Implementation:** Uses local AsyncStorage with mock data

#### Reels Tab (`app/(tabs)/reels.tsx`)

- **Purpose:** Full-screen vertical video content
- **Features:**
  - TikTok/Instagram-style vertical video feed
  - Swipe to navigate between videos
  - Like, comment, share actions
- **API Endpoints:**
  - `GET /posts` - List posts (filtered for video content)
  - Same engagement endpoints as Feed
- **Current Implementation:** Placeholder screen

#### Discover Tab (`app/(tabs)/discover.tsx`)

- **Purpose:** Content and topic exploration
- **Features:**
  - Search bar for content search
  - Topic chips for filtering
  - Trending posts grid
  - NOT for people discovery (use Friends List)
- **API Endpoints:**
  - `GET /discover/posts` - Discover posts by topic
  - `GET /discover/topics` - Get available topics
  - `GET /discover/users` - Discover users
- **Current Implementation:** Uses local AsyncStorage with mock data

#### Profile Tab (`app/(tabs)/profile.tsx`)

- **Purpose:** View and edit own profile
- **Features:**
  - Profile header (avatar, name, handle, bio)
  - Mood label and "now playing" status
  - Reorderable profile modules
  - Module visibility controls
  - Top friends grid
  - Friend count link to Friends List
  - Edit profile button
- **API Endpoints:**
  - `GET /profiles/me` - Get current user's profile
  - `PATCH /profiles/me` - Update profile
  - `GET /profiles/me/top-friends` - Get top friends
  - `PATCH /profiles/me/top-friends` - Update top friends
- **Current Implementation:** Uses local AsyncStorage with mock data

### Modal Screens

#### Compose Modal (`app/compose.tsx`)

- **Purpose:** Create new text post
- **Features:**
  - Text input for post content
  - Topic tagging (auto-inferred or manual)
  - Post button
- **API Endpoints:**
  - `POST /posts` - Create new post
- **Current Implementation:** Uses local AsyncStorage

#### Compose Media Modal (`app/compose-media.tsx`)

- **Purpose:** Create new video/reel post
- **Features:**
  - Media upload
  - Caption input
  - Topic tagging
- **API Endpoints:**
  - `POST /media/upload` - Upload media
  - `POST /posts` - Create post with media
- **Current Implementation:** Placeholder screen

#### Edit Profile Modal (`app/edit-profile.tsx`)

- **Purpose:** Edit profile settings
- **Features:**
  - Name and bio editing
  - Handle editing (with uniqueness check)
  - Wallpaper selection (gradient presets)
  - Accent color selection
  - Mood label and icon selection
  - "Now playing" status
  - Module order and visibility controls
- **API Endpoints:**
  - `PATCH /profiles/me` - Update profile
- **Current Implementation:** Uses local AsyncStorage

#### Friends List Screen (`app/friends-list.tsx`)

- **Purpose:** Manage all friend-related features
- **Features:**
  - Friend requests (incoming, outgoing)
  - Accept/decline friend requests
  - Top friends management
  - All friends list
  - People you may know (suggestions)
  - Send friend requests
  - Remove friends
- **API Endpoints:**
  - `GET /friends/requests` - Get friend requests
  - `POST /friends/requests/:userId` - Send friend request
  - `POST /friends/requests/:userId/accept` - Accept friend request
  - `POST /friends/requests/:userId/decline` - Decline friend request
  - `DELETE /friends/:userId` - Remove friend
  - `GET /friends` - Get friends list
- **Current Implementation:** Uses local AsyncStorage with mock data

### Detail Screens

#### Profile Detail (`app/profile/[id].tsx`)

- **Purpose:** View another user's profile
- **Features:**
  - Profile header (avatar, name, handle, bio)
  - Mood label and "now playing" status
  - Profile modules (filtered by viewer relationship)
  - Top friends grid (if visible)
  - Friend count
  - Send friend request button (if not friends)
  - User's posts
- **API Endpoints:**
  - `GET /profiles/:handle` - Get public profile
  - `GET /posts` - List user's posts
- **Current Implementation:** Uses local AsyncStorage with mock data

#### Post Detail (`app/post/[id].tsx`)

- **Purpose:** View post with comment thread
- **Features:**
  - Post content (text, media, topics)
  - Author info
  - Engagement actions (like, comment, repost, save)
  - Comment thread
  - Add comment input
- **API Endpoints:**
  - `GET /posts/:id` - Get post details
  - `GET /posts/:postId/comments` - Get comments
  - `POST /posts/:postId/comments` - Add comment
  - Same engagement endpoints as Feed
- **Current Implementation:** Uses local AsyncStorage with mock data

### Other Screens

#### Login Screen (`app/login.tsx`)

- **Purpose:** User authentication
- **Features:**
  - Email and password input
  - Login button
  - Register link
- **API Endpoints:**
  - `POST /auth/login` - Log in
  - `POST /auth/register` - Register
- **Current Implementation:** Placeholder screen

#### Notifications Screen (`app/notifications.tsx`)

- **Purpose:** View user notifications
- **Features:**
  - List of notifications
  - Mark as read
  - Mark all as read
- **API Endpoints:**
  - `GET /notifications` - Get notifications
  - `POST /notifications/:id/read` - Mark as read
  - `POST /notifications/read-all` - Mark all as read
- **Current Implementation:** Placeholder screen

## State Management

### SocialDataContext

The `SocialDataContext` (`context/SocialDataContext.tsx`) is the single source of truth for all social data in the mobile app.

**Features:**

- Manages users, posts, friends, and comments
- Persists to AsyncStorage
- Seeds mock data on first launch
- Provides CRUD operations for all entities

**Data Structure:**

```typescript
{
  users: Record<string, User>;
  posts: Record<string, Post>;
  friends: Record<string, Friend[]>;
  friendRequests: Record<string, FriendRequest[]>;
  comments: Record<string, Comment[]>;
  currentUser: string | null;
}
```

**Usage:**

```typescript
const { users, posts, currentUser, createPost, likePost } = useSocialData();
```

## Domain Types

### User (`lib/types.ts`)

```typescript
interface User {
  id: string;
  handle: string;
  name: string;
  bio: string;
  avatarUrl: string;
  wallpaper: string;
  accentColor: string;
  moodLabel: string;
  moodIcon: string;
  nowPlaying: string;
  moduleSettings: ProfileModule[];
  topFriends: string[];
  joinedAt: string;
}
```

### Post (`lib/types.ts`)

```typescript
interface Post {
  id: string;
  authorId: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  topics: string[];
  createdAt: string;
  likeCount: number;
  commentCount: number;
  repostOf?: string; // ID of original post
}
```

### Profile Module (`lib/types.ts`)

```typescript
interface ProfileModule {
  id: string;
  visible: boolean;
  visibility: 'everyone' | 'friends' | 'onlyMe';
  order: number;
}
```

## Styling System

### Theme (`lib/theme.ts`)

The theme system provides presets for wallpapers, accent colors, and mood labels.

**Wallpapers:** Gradient presets using `expo-linear-gradient`
**Accent Colors:** Predefined color palette
**Mood Labels:** Predefined mood options with icons
**Mood Icons:** Emoji icons for mood display

### Colors (`constants/colors.ts`)

Warm cork/paper color palette for the app's visual identity.

## Profile Module Visibility

### Module Logic (`lib/modules.ts`)

The `visibleModulesFor` function determines which profile modules are visible to a given viewer.

**Parameters:**

- `moduleSettings: ProfileModule[]` - User's module configuration
- `viewerIsSelf: boolean` - Whether viewer is the profile owner
- `viewerIsFriend: boolean` - Whether viewer is a friend

**Visibility Rules:**

- `everyone` - Visible to all viewers
- `friends` - Visible only to friends or self
- `onlyMe` - Visible only to self

**Usage:**

```typescript
const visibleModules = visibleModulesFor(
  user.moduleSettings,
  viewerId === userId,
  isFriend(viewerId, userId)
);
```

## Topic System

### Topic Inference (`lib/topics.ts`)

Topics are automatically inferred from post content using simple keyword matching.

**Features:**

- Predefined topic keywords
- Case-insensitive matching
- Multiple topics per post
- Manual topic tagging support

**Example:**

```typescript
const topics = inferTopics('I love hiking and nature!');
// Returns: ["outdoors", "nature"]
```

## Environment Variables

The mobile app requires the following environment variables (see `.env.example`):

- `EXPO_PUBLIC_API_URL` - Base URL for API server
- `EXPO_PUBLIC_ENABLE_MOCK_DATA` - Enable mock data (development only)

## Development Commands

### Run Development Server

```bash
pnpm --filter @workspace/mobile run dev
```

### Run on Device

```bash
# iOS
pnpm --filter @workspace/mobile run ios

# Android
pnpm --filter @workspace/mobile run android
```

### Type Check

```bash
pnpm -w run typecheck:mobile
```

### Test

```bash
pnpm --filter @workspace/mobile test
```

## Current Implementation Status

The mobile app is currently in prototype phase:

- **Implemented:** Feed, Discover, Profile, Friends List, Compose text posts
- **Placeholder:** Reels, Media upload, Login, Notifications
- **Data Storage:** Local AsyncStorage with mock data
- **API Integration:** Not yet connected to backend API

## Migration to Backend API

To connect the mobile app to the backend API:

1. Replace `SocialDataContext` CRUD operations with API client calls
2. Use generated React client from `@workspace/api-client-react`
3. Implement session cookie handling for authentication
4. Replace mock data with real API responses
5. Add error handling for network failures
6. Implement loading states for async operations

## Testing

Mobile tests are written using Vitest with React Native Testing Library.

**Test Files:**

- `app/_layout.test.tsx` - Layout component tests
- `app/compose.test.tsx` - Compose screen tests
- `app/friends-list.test.tsx` - Friends list tests

**Run Tests:**

```bash
pnpm --filter @workspace/mobile test
```

## Performance Considerations

- Use `React.memo` for expensive components
- Implement virtual lists for long feeds (FlatList)
- Lazy load images and media
- Debounce search inputs
- Cache API responses when backend is connected
