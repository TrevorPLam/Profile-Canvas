import { describe, it, expect } from 'vitest';
import {
  insertPostSchema,
  selectPostSchema,
  postContentSchema,
  textPostContentSchema,
  videoPostContentSchema,
  reelPostContentSchema,
  repostInfoSchema,
  type PostKind,
  type RepostInfo,
  type TextPostContent,
  type VideoPostContent,
  type ReelPostContent,
} from './posts';

describe('posts schema', () => {
  describe('PostKind type', () => {
    it('should accept valid post kinds', () => {
      const validKinds: PostKind[] = ['text', 'video', 'reel'];
      expect(validKinds).toHaveLength(3);
    });
  });

  describe('RepostInfo type', () => {
    it('should accept valid repost info', () => {
      const repostInfo: RepostInfo = {
        originalPostId: 'post-123',
        originalAuthorId: 'user-456',
      };
      expect(repostInfo.originalPostId).toBe('post-123');
      expect(repostInfo.originalAuthorId).toBe('user-456');
    });
  });

  describe('TextPostContent type', () => {
    it('should accept valid text post content', () => {
      const content: TextPostContent = {
        kind: 'text',
        text: 'Hello world',
      };
      expect(content.kind).toBe('text');
      expect(content.text).toBe('Hello world');
    });
  });

  describe('VideoPostContent type', () => {
    it('should accept valid video post content', () => {
      const content: VideoPostContent = {
        kind: 'video',
        title: 'My Video',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        durationLabel: '10:30',
        viewsLabel: '1.2K views',
      };
      expect(content.kind).toBe('video');
      expect(content.title).toBe('My Video');
    });
  });

  describe('ReelPostContent type', () => {
    it('should accept valid reel post content', () => {
      const content: ReelPostContent = {
        kind: 'reel',
        caption: 'My caption',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        soundLabel: 'Original Sound',
        viewsLabel: '5.4K views',
      };
      expect(content.kind).toBe('reel');
      expect(content.caption).toBe('My caption');
    });
  });

  describe('Zod schemas', () => {
    describe('repostInfoSchema', () => {
      it('should validate valid repost info', () => {
        const validData = {
          originalPostId: 'post-123',
          originalAuthorId: 'user-456',
        };
        const result = repostInfoSchema.parse(validData);
        expect(result).toEqual(validData);
      });

      it('should reject invalid repost info', () => {
        const invalidData = {
          originalPostId: 'post-123',
          // missing originalAuthorId
        };
        expect(() => repostInfoSchema.parse(invalidData)).toThrow();
      });
    });

    describe('textPostContentSchema', () => {
      it('should validate valid text post content', () => {
        const validData = {
          kind: 'text' as const,
          text: 'Hello world',
        };
        const result = textPostContentSchema.parse(validData);
        expect(result).toEqual(validData);
      });

      it('should reject invalid text post content', () => {
        const invalidData = {
          kind: 'text' as const,
          // missing text
        };
        expect(() => textPostContentSchema.parse(invalidData)).toThrow();
      });
    });

    describe('videoPostContentSchema', () => {
      it('should validate valid video post content', () => {
        const validData = {
          kind: 'video' as const,
          title: 'My Video',
          thumbnailUrl: 'https://example.com/thumb.jpg',
          durationLabel: '10:30',
          viewsLabel: '1.2K views',
        };
        const result = videoPostContentSchema.parse(validData);
        expect(result).toEqual(validData);
      });

      it('should reject invalid video post content', () => {
        const invalidData = {
          kind: 'video' as const,
          title: 'My Video',
          // missing required fields
        };
        expect(() => videoPostContentSchema.parse(invalidData)).toThrow();
      });
    });

    describe('reelPostContentSchema', () => {
      it('should validate valid reel post content', () => {
        const validData = {
          kind: 'reel' as const,
          caption: 'My caption',
          thumbnailUrl: 'https://example.com/thumb.jpg',
          soundLabel: 'Original Sound',
          viewsLabel: '5.4K views',
        };
        const result = reelPostContentSchema.parse(validData);
        expect(result).toEqual(validData);
      });

      it('should reject invalid reel post content', () => {
        const invalidData = {
          kind: 'reel' as const,
          caption: 'My caption',
          // missing required fields
        };
        expect(() => reelPostContentSchema.parse(invalidData)).toThrow();
      });
    });

    describe('postContentSchema', () => {
      it('should validate text post content', () => {
        const validData = {
          kind: 'text' as const,
          text: 'Hello world',
        };
        const result = postContentSchema.parse(validData);
        expect(result).toEqual(validData);
      });

      it('should validate video post content', () => {
        const validData = {
          kind: 'video' as const,
          title: 'My Video',
          thumbnailUrl: 'https://example.com/thumb.jpg',
          durationLabel: '10:30',
          viewsLabel: '1.2K views',
        };
        const result = postContentSchema.parse(validData);
        expect(result).toEqual(validData);
      });

      it('should validate reel post content', () => {
        const validData = {
          kind: 'reel' as const,
          caption: 'My caption',
          thumbnailUrl: 'https://example.com/thumb.jpg',
          soundLabel: 'Original Sound',
          viewsLabel: '5.4K views',
        };
        const result = postContentSchema.parse(validData);
        expect(result).toEqual(validData);
      });

      it('should reject invalid kind', () => {
        const invalidData = {
          kind: 'invalid' as const,
          text: 'Hello',
        };
        expect(() => postContentSchema.parse(invalidData)).toThrow();
      });
    });

    describe('insertPostSchema', () => {
      it('should validate valid post insert data', () => {
        const validData = {
          authorId: '550e8400-e29b-41d4-a716-446655440000',
          kind: 'text' as const,
          content: {
            kind: 'text' as const,
            text: 'Hello world',
          },
          topics: ['lifestyle'],
        };
        const result = insertPostSchema.parse(validData);
        expect(result.authorId).toBe('550e8400-e29b-41d4-a716-446655440000');
      });
    });

    describe('selectPostSchema', () => {
      it('should validate valid post select data', () => {
        const validData = {
          id: '550e8400-e29b-41d4-a716-446655440001',
          authorId: '550e8400-e29b-41d4-a716-446655440000',
          kind: 'text' as const,
          content: {
            kind: 'text' as const,
            text: 'Hello world',
          },
          repostOf: null,
          remixOf: null,
          duetOf: null,
          topics: ['lifestyle'],
          audience: 'everyone' as const,
          audienceListId: null,
          collabRequestStatus: null,
          secondAuthorId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };
        const result = selectPostSchema.parse(validData);
        expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440001');
      });
    });
  });
});
