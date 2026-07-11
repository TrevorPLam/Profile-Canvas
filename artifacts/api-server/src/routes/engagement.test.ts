import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import engagementRouter from './engagement';
import { engagementService } from '../services/engagementService';

// Mock the requireAuth middleware for testing
vi.mock('../middlewares/auth', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.userId = 'test-user-id';
    next();
  },
}));

// Mock the engagementService
vi.mock('../services/engagementService', () => ({
  engagementService: {
    toggleLike: vi.fn(),
    unlike: vi.fn(),
    toggleSave: vi.fn(),
    unsave: vi.fn(),
  },
}));

describe('engagement routes', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/posts', engagementRouter);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /posts/:postId/like', () => {
    it('should like a post successfully', async () => {
      const mockSummary = {
        postId: 'post-123',
        likeCount: 1,
        saveCount: 0,
        repostCount: 0,
        viewerHasLiked: true,
        viewerHasSaved: false,
        viewerHasReposted: false,
      };
      vi.mocked(engagementService.toggleLike).mockResolvedValue(mockSummary);

      const response = await request(app).post('/posts/post-123/like').expect(200);

      expect(response.body).toEqual(mockSummary);
      expect(engagementService.toggleLike).toHaveBeenCalledWith({
        userId: 'test-user-id',
        postId: 'post-123',
      });
    });

    it('should return 404 when post not found', async () => {
      vi.mocked(engagementService.toggleLike).mockRejectedValue(new Error('Post not found'));

      const response = await request(app).post('/posts/post-123/like').expect(404);

      expect(response.body).toEqual({ message: 'Post not found' });
    });

    it('should return 500 on server error', async () => {
      vi.mocked(engagementService.toggleLike).mockRejectedValue(new Error('Database error'));

      const response = await request(app).post('/posts/post-123/like').expect(500);

      expect(response.body).toEqual({ message: 'Internal server error' });
    });
  });

  describe('DELETE /posts/:postId/like', () => {
    it('should unlike a post successfully', async () => {
      const mockSummary = {
        postId: 'post-123',
        likeCount: 0,
        saveCount: 0,
        repostCount: 0,
        viewerHasLiked: false,
        viewerHasSaved: false,
        viewerHasReposted: false,
      };
      vi.mocked(engagementService.unlike).mockResolvedValue(mockSummary);

      const response = await request(app).delete('/posts/post-123/like').expect(200);

      expect(response.body).toEqual(mockSummary);
      expect(engagementService.unlike).toHaveBeenCalledWith({
        userId: 'test-user-id',
        postId: 'post-123',
      });
    });

    it('should return 404 when post not found', async () => {
      vi.mocked(engagementService.unlike).mockRejectedValue(new Error('Post not found'));

      const response = await request(app).delete('/posts/post-123/like').expect(404);

      expect(response.body).toEqual({ message: 'Post not found' });
    });

    it('should return 500 on server error', async () => {
      vi.mocked(engagementService.unlike).mockRejectedValue(new Error('Database error'));

      const response = await request(app).delete('/posts/post-123/like').expect(500);

      expect(response.body).toEqual({ message: 'Internal server error' });
    });
  });

  describe('POST /posts/:postId/save', () => {
    it('should save a post successfully', async () => {
      const mockSummary = {
        postId: 'post-123',
        likeCount: 0,
        saveCount: 1,
        repostCount: 0,
        viewerHasLiked: false,
        viewerHasSaved: true,
        viewerHasReposted: false,
      };
      vi.mocked(engagementService.toggleSave).mockResolvedValue(mockSummary);

      const response = await request(app).post('/posts/post-123/save').expect(200);

      expect(response.body).toEqual(mockSummary);
      expect(engagementService.toggleSave).toHaveBeenCalledWith({
        userId: 'test-user-id',
        postId: 'post-123',
      });
    });

    it('should return 404 when post not found', async () => {
      vi.mocked(engagementService.toggleSave).mockRejectedValue(new Error('Post not found'));

      const response = await request(app).post('/posts/post-123/save').expect(404);

      expect(response.body).toEqual({ message: 'Post not found' });
    });

    it('should return 500 on server error', async () => {
      vi.mocked(engagementService.toggleSave).mockRejectedValue(new Error('Database error'));

      const response = await request(app).post('/posts/post-123/save').expect(500);

      expect(response.body).toEqual({ message: 'Internal server error' });
    });
  });

  describe('DELETE /posts/:postId/save', () => {
    it('should unsave a post successfully', async () => {
      const mockSummary = {
        postId: 'post-123',
        likeCount: 0,
        saveCount: 0,
        repostCount: 0,
        viewerHasLiked: false,
        viewerHasSaved: false,
        viewerHasReposted: false,
      };
      vi.mocked(engagementService.unsave).mockResolvedValue(mockSummary);

      const response = await request(app).delete('/posts/post-123/save').expect(200);

      expect(response.body).toEqual(mockSummary);
      expect(engagementService.unsave).toHaveBeenCalledWith({
        userId: 'test-user-id',
        postId: 'post-123',
      });
    });

    it('should return 404 when post not found', async () => {
      vi.mocked(engagementService.unsave).mockRejectedValue(new Error('Post not found'));

      const response = await request(app).delete('/posts/post-123/save').expect(404);

      expect(response.body).toEqual({ message: 'Post not found' });
    });

    it('should return 500 on server error', async () => {
      vi.mocked(engagementService.unsave).mockRejectedValue(new Error('Database error'));

      const response = await request(app).delete('/posts/post-123/save').expect(500);

      expect(response.body).toEqual({ message: 'Internal server error' });
    });
  });

  describe('idempotency', () => {
    it('should handle duplicate like requests idempotently', async () => {
      const mockSummary = {
        postId: 'post-123',
        likeCount: 1,
        saveCount: 0,
        repostCount: 0,
        viewerHasLiked: true,
        viewerHasSaved: false,
        viewerHasReposted: false,
      };
      vi.mocked(engagementService.toggleLike).mockResolvedValue(mockSummary);

      // First like
      await request(app).post('/posts/post-123/like').expect(200);
      // Duplicate like (should still return 200 with same count)
      await request(app).post('/posts/post-123/like').expect(200);

      expect(engagementService.toggleLike).toHaveBeenCalledTimes(2);
    });

    it('should handle unlike when not liked idempotently', async () => {
      const mockSummary = {
        postId: 'post-123',
        likeCount: 0,
        saveCount: 0,
        repostCount: 0,
        viewerHasLiked: false,
        viewerHasSaved: false,
        viewerHasReposted: false,
      };
      vi.mocked(engagementService.unlike).mockResolvedValue(mockSummary);

      // Unlike when not liked
      await request(app).delete('/posts/post-123/like').expect(200);

      expect(engagementService.unlike).toHaveBeenCalledWith({
        userId: 'test-user-id',
        postId: 'post-123',
      });
    });

    it('should handle duplicate save requests idempotently', async () => {
      const mockSummary = {
        postId: 'post-123',
        likeCount: 0,
        saveCount: 1,
        repostCount: 0,
        viewerHasLiked: false,
        viewerHasSaved: true,
        viewerHasReposted: false,
      };
      vi.mocked(engagementService.toggleSave).mockResolvedValue(mockSummary);

      // First save
      await request(app).post('/posts/post-123/save').expect(200);
      // Duplicate save (should still return 200 with same count)
      await request(app).post('/posts/post-123/save').expect(200);

      expect(engagementService.toggleSave).toHaveBeenCalledTimes(2);
    });

    it('should handle unsave when not saved idempotently', async () => {
      const mockSummary = {
        postId: 'post-123',
        likeCount: 0,
        saveCount: 0,
        repostCount: 0,
        viewerHasLiked: false,
        viewerHasSaved: false,
        viewerHasReposted: false,
      };
      vi.mocked(engagementService.unsave).mockResolvedValue(mockSummary);

      // Unsave when not saved
      await request(app).delete('/posts/post-123/save').expect(200);

      expect(engagementService.unsave).toHaveBeenCalledWith({
        userId: 'test-user-id',
        postId: 'post-123',
      });
    });
  });
});
