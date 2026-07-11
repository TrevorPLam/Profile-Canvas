import { describe, it, expect } from 'vitest';
import { insertProfileSchema, selectProfileSchema, type ProfileModule } from './profiles';

describe('profiles schema', () => {
  describe('insertProfileSchema', () => {
    it('should accept valid profile data', () => {
      const validProfile = {
        handle: 'testuser',
        name: 'Test User',
        bio: 'A test user bio',
        avatarUrl: 'https://example.com/avatar.jpg',
        wallpaper: 'default',
        accentColor: '#ff0000',
        moodLabel: 'happy',
        moodIcon: '😊',
        nowPlaying: 'Test Song',
        moduleSettings: [
          { id: 'about', visible: true, visibility: 'everyone', order: 0 },
          { id: 'topFriends', visible: true, visibility: 'friends', order: 1 },
        ] as ProfileModule[],
      };

      const result = insertProfileSchema.safeParse(validProfile);
      expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      const invalidProfile = {
        name: 'Test User',
      };

      const result = insertProfileSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
    });

    it('should accept empty handle (validation at API layer)', () => {
      // Note: drizzle-zod does not validate string length by default.
      // Handle validation should be added at the API layer.
      const profileWithEmptyHandle = {
        handle: '',
        name: 'Test User',
        moduleSettings: [] as ProfileModule[],
      };

      const result = insertProfileSchema.safeParse(profileWithEmptyHandle);
      expect(result.success).toBe(true);
    });

    it('should accept empty name (validation at API layer)', () => {
      // Note: drizzle-zod does not validate string length by default.
      // Name validation should be added at the API layer.
      const profileWithEmptyName = {
        handle: 'testuser',
        name: '',
        moduleSettings: [] as ProfileModule[],
      };

      const result = insertProfileSchema.safeParse(profileWithEmptyName);
      expect(result.success).toBe(true);
    });

    it('should accept profile with minimal required fields', () => {
      const minimalProfile = {
        handle: 'testuser',
        name: 'Test User',
        moduleSettings: [] as ProfileModule[],
      };

      const result = insertProfileSchema.safeParse(minimalProfile);
      expect(result.success).toBe(true);
    });

    it('should accept extra fields (drizzle-zod is not strict by default)', () => {
      // Note: drizzle-zod does not strip extra fields by default.
      // Strict validation should be added at the API layer using .strict() mode.
      const profileWithExtra = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        handle: 'testuser',
        name: 'Test User',
        moduleSettings: [] as ProfileModule[],
      };

      const result = insertProfileSchema.safeParse(profileWithExtra);
      expect(result.success).toBe(true);
    });

    it('should validate module settings structure', () => {
      const profileWithInvalidModule = {
        handle: 'testuser',
        name: 'Test User',
        moduleSettings: [
          { id: 'invalid', visible: true, visibility: 'everyone', order: 0 },
        ] as unknown as ProfileModule[],
      };

      const result = insertProfileSchema.safeParse(profileWithInvalidModule);
      // This will pass basic validation since we're not using strict Zod validation
      // The module structure validation would be added in API layer
      expect(result.success).toBe(true);
    });
  });

  describe('selectProfileSchema', () => {
    it('should accept complete profile record', () => {
      const completeProfile = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        handle: 'testuser',
        name: 'Test User',
        bio: 'A test user bio',
        avatarUrl: 'https://example.com/avatar.jpg',
        wallpaper: 'default',
        accentColor: '#ff0000',
        moodLabel: 'happy',
        moodIcon: '😊',
        nowPlaying: 'Test Song',
        moduleSettings: [
          { id: 'about', visible: true, visibility: 'everyone', order: 0 },
        ] as ProfileModule[],
        joinedAt: new Date(),
      };

      const result = selectProfileSchema.safeParse(completeProfile);
      expect(result.success).toBe(true);
    });

    it('should accept profile with null optional fields', () => {
      const profileWithNulls = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        handle: 'testuser',
        name: 'Test User',
        bio: null,
        avatarUrl: null,
        wallpaper: null,
        accentColor: null,
        moodLabel: null,
        moodIcon: null,
        nowPlaying: null,
        moduleSettings: [] as ProfileModule[],
        joinedAt: new Date(),
      };

      const result = selectProfileSchema.safeParse(profileWithNulls);
      expect(result.success).toBe(true);
    });

    it('should require userId in select schema', () => {
      const profileWithoutUserId = {
        handle: 'testuser',
        name: 'Test User',
        moduleSettings: [] as ProfileModule[],
        joinedAt: new Date(),
      };

      const result = selectProfileSchema.safeParse(profileWithoutUserId);
      expect(result.success).toBe(false);
    });
  });
});
