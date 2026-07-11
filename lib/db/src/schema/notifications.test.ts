import { describe, it, expect } from 'vitest';
import { insertNotificationSchema, notificationTypeSchema } from './notifications';

describe('notifications schema', () => {
  describe('insertNotificationSchema', () => {
    it('should validate a valid notification with postId', () => {
      const result = insertNotificationSchema.safeParse({
        recipientId: '550e8400-e29b-41d4-a716-446655440000',
        actorId: '550e8400-e29b-41d4-a716-446655440001',
        type: 'like',
        postId: '550e8400-e29b-41d4-a716-446655440002',
      });
      expect(result.success).toBe(true);
    });

    it('should validate a valid notification without postId', () => {
      const result = insertNotificationSchema.safeParse({
        recipientId: '550e8400-e29b-41d4-a716-446655440000',
        actorId: '550e8400-e29b-41d4-a716-446655440001',
        type: 'friendRequest',
        postId: null,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid recipientId', () => {
      const result = insertNotificationSchema.safeParse({
        recipientId: 'not-a-uuid',
        actorId: '550e8400-e29b-41d4-a716-446655440001',
        type: 'like',
        postId: null,
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid actorId', () => {
      const result = insertNotificationSchema.safeParse({
        recipientId: '550e8400-e29b-41d4-a716-446655440000',
        actorId: 'not-a-uuid',
        type: 'like',
        postId: null,
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid type', () => {
      const result = insertNotificationSchema.safeParse({
        recipientId: '550e8400-e29b-41d4-a716-446655440000',
        actorId: '550e8400-e29b-41d4-a716-446655440001',
        type: 'invalid-type',
        postId: null,
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid postId', () => {
      const result = insertNotificationSchema.safeParse({
        recipientId: '550e8400-e29b-41d4-a716-446655440000',
        actorId: '550e8400-e29b-41d4-a716-446655440001',
        type: 'like',
        postId: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
    });

    it('should accept all valid notification types', () => {
      const types = [
        'like',
        'comment',
        'friendRequest',
        'friendAccepted',
        'repost',
        'save',
      ] as const;
      types.forEach((type) => {
        const result = insertNotificationSchema.safeParse({
          recipientId: '550e8400-e29b-41d4-a716-446655440000',
          actorId: '550e8400-e29b-41d4-a716-446655440001',
          type,
          postId: null,
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('notificationTypeSchema', () => {
    it('should accept all valid notification types', () => {
      const types = ['like', 'comment', 'friendRequest', 'friendAccepted', 'repost', 'save'];
      types.forEach((type) => {
        const result = notificationTypeSchema.safeParse(type);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid notification types', () => {
      const result = notificationTypeSchema.safeParse('invalid-type');
      expect(result.success).toBe(false);
    });
  });
});
