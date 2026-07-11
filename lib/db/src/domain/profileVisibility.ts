import { type ProfileModule } from '../schema';

/**
 * Domain helper for filtering profile modules based on viewer relationship
 * Ported from mobile app's lib/modules.ts for backend use
 * 
 * This is pure domain logic with no database dependencies, making it easy to test
 * and reuse across different contexts (API, services, etc.)
 * 
 * @param moduleSettings - The profile's module configuration
 * @param viewerIsSelf - Whether the viewer is the profile owner
 * @param viewerIsFriend - Whether the viewer is a friend of the profile owner
 * @returns Filtered and sorted array of visible modules
 */
export function visibleModulesFor(
  moduleSettings: ProfileModule[],
  viewerIsSelf: boolean,
  viewerIsFriend: boolean
): ProfileModule[] {
  return [...moduleSettings]
    .sort((a, b) => a.order - b.order)
    .filter((m) => {
      if (!m.visible) return false;
      if (viewerIsSelf) return true;
      if (m.visibility === 'onlyMe') return false;
      if (m.visibility === 'friends') return viewerIsFriend;
      return true;
    });
}
