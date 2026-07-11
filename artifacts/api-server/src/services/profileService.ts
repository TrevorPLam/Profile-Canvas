import { ProfileRepository, type VisibleProfile, type ProfileUpdateInput, visibleModulesFor, type ProfileModule } from '@workspace/db';
import { validateModuleSettings, type ModuleValidationError } from './profileValidation';
import { friendshipService } from './friendshipService';

/**
 * Domain types for profile service
 * These hide the implementation details from API layer
 */

export interface ProfileForViewer {
  userId: string;
  handle: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  wallpaper: string | null;
  accentColor: string | null;
  moodLabel: string | null;
  moodIcon: string | null;
  nowPlaying: string | null;
  moduleSettings: ProfileModule[];
  joinedAt: Date;
}

/**
 * ProfileService encapsulates profile business logic.
 * 
 * Deep module: Hides visibility filtering, relationship checks, and module validation
 * behind a simple interface of domain operations.
 */
export class ProfileService {
  private profileRepo: ProfileRepository;

  constructor() {
    this.profileRepo = new ProfileRepository();
  }

  /**
   * Get a profile filtered by viewer relationship
   * @param handle - The profile handle to fetch
   * @param viewerId - The viewer's user ID (null if unauthenticated)
   * @returns The profile with modules filtered by visibility, or null if not found
   */
  async getProfileForViewer(
    handle: string,
    viewerId: string | null
  ): Promise<ProfileForViewer | null> {
    const profile = await this.profileRepo.getByHandle(handle);
    if (!profile) {
      return null;
    }

    // Determine viewer relationship
    const viewerIsSelf = viewerId === profile.userId;
    let viewerIsFriend = false;
    if (viewerId && !viewerIsSelf) {
      viewerIsFriend = await friendshipService.areFriends(viewerId, profile.userId);
    }

    // Filter modules by visibility
    const filteredModules = visibleModulesFor(
      profile.moduleSettings,
      viewerIsSelf,
      viewerIsFriend
    );

    return {
      ...profile,
      moduleSettings: filteredModules,
    };
  }

  /**
   * Get the authenticated user's full profile
   * @param userId - The authenticated user's ID
   * @returns The user's full profile with all modules, or null if not found
   */
  async getMyProfile(userId: string): Promise<ProfileForViewer | null> {
    const profile = await this.profileRepo.getByUserId(userId);
    if (!profile) {
      return null;
    }

    // Owner sees all modules regardless of visibility
    return profile;
  }

  /**
   * Update a user's profile
   * @param userId - The user's ID
   * @param updates - Fields to update
   * @returns The updated profile, or null if not found
   * @throws Error if module settings are invalid
   */
  async updateProfile(
    userId: string,
    updates: ProfileUpdateInput
  ): Promise<ProfileForViewer | null> {
    // Validate module settings if provided
    if (updates.moduleSettings) {
      const validationErrors = this.validateModuleSettings(updates.moduleSettings);
      if (validationErrors.length > 0) {
        throw new Error(
          `Invalid module settings: ${validationErrors.map((e) => e.message).join(', ')}`
        );
      }
    }

    const updatedProfile = await this.profileRepo.update(userId, updates);
    return updatedProfile;
  }

  /**
   * Validate module settings structure
   * @param moduleSettings - The module settings to validate
   * @returns Array of validation errors (empty if valid)
   */
  validateModuleSettings(moduleSettings: ProfileModule[]): ModuleValidationError[] {
    return validateModuleSettings(moduleSettings);
  }
}

// Export a singleton instance for convenience
export const profileService = new ProfileService();
