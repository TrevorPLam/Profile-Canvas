import type { ProfileModule, UserProfile } from '@/lib/types';

export function visibleModulesFor(
  profile: UserProfile,
  viewerIsSelf: boolean,
  viewerIsFriend: boolean,
): ProfileModule[] {
  return [...profile.modules]
    .sort((a, b) => a.order - b.order)
    .filter((m) => {
      if (!m.visible) return false;
      if (viewerIsSelf) return true;
      if (m.visibility === 'onlyMe') return false;
      if (m.visibility === 'friends') return viewerIsFriend;
      return true;
    });
}
