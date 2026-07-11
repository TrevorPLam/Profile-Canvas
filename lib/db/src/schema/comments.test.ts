import { describe, it, expect } from 'vitest';
import { insertCommentSchema, selectCommentSchema } from './comments';

describe('comments schema', () => {
  describe('insertCommentSchema', () => {
    it('should accept valid comment data', () => {
      const validComment = {
        postId: '123e4567-e89b-12d3-a456-426614174000',
        authorId: '123e4567-e89b-12d3-a456-426614174001',
        text: 'This is a test comment',
      };

      const result = insertCommentSchema.safeParse(validComment);
      expect(result.success).toBe(true);
    });

    it('should reject comment without postId', () => {
      const invalidComment = {
        authorId: '123e4567-e89b-12d3-a456-426614174001',
        text: 'This is a test comment',
      };

      const result = insertCommentSchema.safeParse(invalidComment);
      expect(result.success).toBe(false);
    });

    it('should reject comment without authorId', () => {
      const invalidComment = {
        postId: '123e4567-e89b-12d3-a456-426614174000',
        text: 'This is a test comment',
      };

      const result = insertCommentSchema.safeParse(invalidComment);
      expect(result.success).toBe(false);
    });

    it('should reject comment without text', () => {
      const invalidComment = {
        postId: '123e4567-e89b-12d3-a456-426614174000',
        authorId: '123e4567-e89b-12d3-a456-426614174001',
      };

      const result = insertCommentSchema.safeParse(invalidComment);
      expect(result.success).toBe(false);
    });

    it('should reject comment with empty text', () => {
      const invalidComment = {
        postId: '123e4567-e89b-12d3-a456-426614174000',
        authorId: '123e4567-e89b-12d3-a456-426614174001',
        text: '',
      };

      const result = insertCommentSchema.safeParse(invalidComment);
      expect(result.success).toBe(false);
    });

    it('should reject comment with invalid UUID for postId', () => {
      const invalidComment = {
        postId: 'not-a-uuid',
        authorId: '123e4567-e89b-12d3-a456-426614174001',
        text: 'This is a test comment',
      };

      const result = insertCommentSchema.safeParse(invalidComment);
      expect(result.success).toBe(false);
    });

    it('should reject comment with invalid UUID for authorId', () => {
      const invalidComment = {
        postId: '123e4567-e89b-12d3-a456-426614174000',
        authorId: 'not-a-uuid',
        text: 'This is a test comment',
      };

      const result = insertCommentSchema.safeParse(invalidComment);
      expect(result.success).toBe(false);
    });
  });

  describe('selectCommentSchema', () => {
    it('should accept valid comment with all fields', () => {
      const validComment = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        postId: '123e4567-e89b-12d3-a456-426614174001',
        authorId: '123e4567-e89b-12d3-a456-426614174002',
        text: 'This is a test comment',
        createdAt: new Date(),
      };

      const result = selectCommentSchema.safeParse(validComment);
      expect(result.success).toBe(true);
    });

    it('should reject comment without id', () => {
      const invalidComment = {
        postId: '123e4567-e89b-12d3-a456-426614174001',
        authorId: '123e4567-e89b-12d3-a456-426614174002',
        text: 'This is a test comment',
        createdAt: new Date(),
      };

      const result = selectCommentSchema.safeParse(invalidComment);
      expect(result.success).toBe(false);
    });

    it('should reject comment without createdAt', () => {
      const invalidComment = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        postId: '123e4567-e89b-12d3-a456-426614174001',
        authorId: '123e4567-e89b-12d3-a456-426614174002',
        text: 'This is a test comment',
      };

      const result = selectCommentSchema.safeParse(invalidComment);
      expect(result.success).toBe(false);
    });
  });
});
