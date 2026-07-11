# Corkboard

A social app that mixes a short-text feed, YouTube-style videos, and TikTok/Instagram-style reels with MySpace-era profile customization — wallpapers, accent colors, mood/now-playing, reorderable/hideable profile sections, and a Top Friends grid.

## Run & Operate

- `pnpm --filter @workspace/mobile run dev` — run the Corkboard Expo app (bound to the `artifacts/mobile: expo` workflow)
- `pnpm run typecheck` — full typecheck across all packages
- The `artifacts/api-server` and `artifacts/mockup-sandbox` artifacts exist in this workspace but are not used by Corkboard.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo (React Native) + expo-router, `@expo-google-fonts/inter`, `expo-linear-gradient`, `@react-native-async-storage/async-storage`
- Persistence: local-only via AsyncStorage (no backend/DB yet — see Architecture decisions)

## Where things live

- `artifacts/mobile/app/` — expo-router screens: `(tabs)/index.tsx` (Feed), `(tabs)/reels.tsx`, `(tabs)/friends.tsx`, `(tabs)/profile.tsx` (own profile), `profile/[id].tsx` (other users), `edit-profile.tsx` and `compose.tsx` (modals)
- `artifacts/mobile/context/SocialDataContext.tsx` — single source of truth for users/posts/friends, persisted to AsyncStorage
- `artifacts/mobile/lib/types.ts`, `lib/theme.ts`, `lib/mockData.ts`, `lib/modules.ts` — domain types, wallpaper/accent/mood presets, seed data, profile-module visibility logic
- `artifacts/mobile/constants/colors.ts` — warm cork/paper color palette

## Architecture decisions

- First build is frontend-only by design: all data lives in AsyncStorage, seeded with mock users/posts on first launch. Text posts you write are real; video/reel content is illustrative seed data (no camera/video backend yet).
- Feed shows all seeded users' content (discover-style); a separate Friends tab holds the actual friend graph (requests/accept/decline/top friends) so the two concerns don't get conflated.
- Profile customization (wallpaper, accent color, mood, now-playing, bio, top friends, module order/visibility) is modeled as data on `UserProfile`, not styling logic scattered across screens — see `lib/theme.ts` and `lib/modules.ts::visibleModulesFor`.
- Avatars are deterministic color+initials (no generated portraits); wallpapers are gradient presets via `expo-linear-gradient`, not images.

## Product

Corkboard combines a text/video/reels feed with MySpace-style profile customization: users can set a wallpaper, accent color, mood, and "now playing", reorder and control the visibility (everyone/friends/only me) of profile sections, and curate a Top Friends grid. Friend requests and a friends list are separate from the public discover feed.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
