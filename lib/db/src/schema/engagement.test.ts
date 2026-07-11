import { describe, it, expect } from 'vitest';
import { insertLikeSchema, insertSaveSchema } from './engagement';

describe('engagement schema validation', () => {
  describe('insertLikeSchema', () => {
    it('should accept valid like data', () => {
      const validLike = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        postId: '123e4567-e89b-12d3-a456-426614174001',
      };
      expect(insertLikeSchema.parse(validLike)).toEqual(validLike);
    });

    it('should reject invalid userId format', () => {
      const invalidLike = {
        userId: 'not-a-uuid',
        postId: '123e4567-e89b-12d3-a456-426614174001',
      };
      expect(() => insertLikeSchema.parse(invalidLike)).toThrow();
    });

    it('should reject invalid postId format', () => {
      const invalidLike = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        postId: 'not-a-uuid',
      };
      expect(() => insertLikeSchema.parse(invalidLike)).toThrow();
    });

    it('should reject missing userId', () => {
      const invalidLike = {
        postId: '123e4567-e89b-12d3-a456-426614174001',
      };
      expect(() => insertLikeSchema.parse(invalidLike)).toThrow();
    });

    it('should reject missing postId', () => {
      const invalidLike = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
      };
      expect(() => insertLikeSchema.parse(invalidLike)).toThrow();
    });
  });

  describe('insertSaveSchema', () => {
    it('should accept valid save data', () => {
      const validSave = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        postId: '123e4567-e89b-12d3-a456-426614174001',
      };
      expect(insertSaveSchema.parse(validSave)).toEqual(validSave);
    });

    it('should reject invalid userId format', () => {
      const invalidSave = {
        userId: 'not-a-uuid',
        postId: '123e4567-e89b-12d3-a456-426614174001',
      };
      expect(() => insertSaveSchema.parse(invalidSave)).toThrow();
    });

    it('should reject invalid postId format', () => {
      const invalidSave = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        postId: 'not-a-uuid',
      };
      expect(() => insertSaveSchema.parse(invalidSave)).toThrow();
    });

    it('should reject missing userId', () => {
      const invalidSave = {
        postId: '123e4567-e89b-12d3-a456-426614174001',
      };
      expect(() => insertSaveSchema.parse(invalidSave)).toThrow();
    });

    it('should reject missing postId', () => {
      const invalidSave = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
      };
      expect(() => insertSaveSchema.parse(invalidSave)).toThrow();
    });
  });
});
