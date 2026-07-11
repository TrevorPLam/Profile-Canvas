import { describe, it, expect } from 'vitest';
import { insertUserSchema, selectUserSchema } from './users';

describe('users schema', () => {
  describe('insertUserSchema', () => {
    it('should accept valid user data', () => {
      const validUser = {
        email: 'test@example.com',
        passwordHash: 'hashed_password',
      };

      const result = insertUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('should reject missing email', () => {
      const invalidUser = {
        passwordHash: 'hashed_password',
      };

      const result = insertUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('should accept user without passwordHash (for OAuth users)', () => {
      const validUser = {
        email: 'oauth@example.com',
      };

      const result = insertUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('should accept extra fields (drizzle-zod is not strict by default)', () => {
      // Note: drizzle-zod does not strip extra fields by default.
      // Strict validation should be added at the API layer using .strict() mode.
      const userWithExtra = {
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        id: 'some-uuid', // Extra field
      };

      const result = insertUserSchema.safeParse(userWithExtra);
      expect(result.success).toBe(true);
    });

    it('should accept any string as email (format validation at API layer)', () => {
      // Note: drizzle-zod does not validate email format by default.
      // Email format validation should be added at the API layer.
      const userWithInvalidEmail = {
        email: 'not-an-email',
        passwordHash: 'hashed_password',
      };

      const result = insertUserSchema.safeParse(userWithInvalidEmail);
      expect(result.success).toBe(true);
    });
  });

  describe('selectUserSchema', () => {
    it('should accept complete user record', () => {
      const completeUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        emailVerified: new Date(),
        passwordHash: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = selectUserSchema.safeParse(completeUser);
      expect(result.success).toBe(true);
    });

    it('should accept user with null optional fields', () => {
      const userWithNulls = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        emailVerified: null,
        passwordHash: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = selectUserSchema.safeParse(userWithNulls);
      expect(result.success).toBe(true);
    });
  });
});
