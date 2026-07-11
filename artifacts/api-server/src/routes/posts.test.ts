import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import postsRouter from './posts';
import authRouter from './auth';
import { db, usersTable, sessionsTable, postsTable } from '@workspace/db';

// Create test app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRouter);
app.use('/api/posts', postsRouter);

// Skip tests if DATABASE_URL is not set
const runTests = !!process.env.DATABASE_URL;

describe.runIf(runTests)('Posts Routes', () => {
  let authCookie: string;
  let userId: string;

  beforeAll(async () => {
    // Clean up any existing test data
    await db.delete(postsTable);
    await db.delete(sessionsTable);
    await db.delete(usersTable);

    // Register a test user and get auth cookie
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'posttest@example.com',
        password: 'password123',
      })
      .expect(201);

    authCookie = registerResponse.headers['set-cookie'][0];
    userId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(postsTable);
    await db.delete(sessionsTable);
    await db.delete(usersTable);
  });

  describe('POST /api/posts', () => {
    it('should create a text post with inferred topics', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Cookie', authCookie)
        .send({
          kind: 'text',
          text: 'I love music and songs',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('authorId', userId);
      expect(response.body).toHaveProperty('kind', 'text');
      expect(response.body).toHaveProperty('text', 'I love music and songs');
      expect(response.body.topics).toContain('music');
    });

    it('should create a video post', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Cookie', authCookie)
        .send({
          kind: 'video',
          title: 'My Video',
          thumbnailUrl: 'https://example.com/thumb.jpg',
          durationLabel: '5:00',
          viewsLabel: '1K',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('kind', 'video');
      expect(response.body).toHaveProperty('title', 'My Video');
    });

    it('should create a reel post', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Cookie', authCookie)
        .send({
          kind: 'reel',
          caption: 'My Reel',
          thumbnailUrl: 'https://example.com/thumb.jpg',
          soundLabel: 'Popular Song',
          viewsLabel: '10K',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('kind', 'reel');
      expect(response.body).toHaveProperty('caption', 'My Reel');
    });

    it('should reject post creation without authentication', async () => {
      await request(app)
        .post('/api/posts')
        .send({
          kind: 'text',
          text: 'Test post',
        })
        .expect(401);
    });

    it('should reject invalid post kind', async () => {
      await request(app)
        .post('/api/posts')
        .set('Cookie', authCookie)
        .send({
          kind: 'invalid',
        })
        .expect(400);
    });
  });

  describe('GET /api/posts', () => {
    beforeAll(async () => {
      // Create a test post
      await request(app).post('/api/posts').set('Cookie', authCookie).send({
        kind: 'text',
        text: 'Test post for listing',
      });
    });

    it('should list all posts', async () => {
      const response = await request(app).get('/api/posts').expect(200);

      expect(response.body).toHaveProperty('posts');
      expect(Array.isArray(response.body.posts)).toBe(true);
      expect(response.body.posts.length).toBeGreaterThan(0);
    });

    it('should filter posts by authorId', async () => {
      const response = await request(app).get(`/api/posts?authorId=${userId}`).expect(200);

      expect(response.body).toHaveProperty('posts');
      expect(
        response.body.posts.every((post: { authorId: string }) => post.authorId === userId)
      ).toBe(true);
    });

    it('should support pagination with limit and offset', async () => {
      const response = await request(app).get('/api/posts?limit=5&offset=0').expect(200);

      expect(response.body).toHaveProperty('posts');
      expect(response.body.posts.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/posts/:postId', () => {
    let testPostId: string;

    beforeAll(async () => {
      const response = await request(app).post('/api/posts').set('Cookie', authCookie).send({
        kind: 'text',
        text: 'Test post for get',
      });
      testPostId = response.body.id;
    });

    it('should get a post by ID', async () => {
      const response = await request(app).get(`/api/posts/${testPostId}`).expect(200);

      expect(response.body).toHaveProperty('id', testPostId);
      expect(response.body).toHaveProperty('authorId', userId);
    });

    it('should return 404 for non-existent post', async () => {
      await request(app).get('/api/posts/00000000-0000-0000-0000-000000000000').expect(404);
    });
  });

  describe('DELETE /api/posts/:postId', () => {
    let testPostId: string;

    beforeAll(async () => {
      const response = await request(app).post('/api/posts').set('Cookie', authCookie).send({
        kind: 'text',
        text: 'Test post for delete',
      });
      testPostId = response.body.id;
    });

    it('should delete own post', async () => {
      await request(app).delete(`/api/posts/${testPostId}`).set('Cookie', authCookie).expect(204);
    });

    it('should reject deletion without authentication', async () => {
      const response = await request(app).post('/api/posts').set('Cookie', authCookie).send({
        kind: 'text',
        text: 'Another test post',
      });
      const postId = response.body.id;

      await request(app).delete(`/api/posts/${postId}`).expect(401);
    });

    it('should return 404 for non-existent post deletion', async () => {
      await request(app)
        .delete('/api/posts/00000000-0000-0000-0000-000000000000')
        .set('Cookie', authCookie)
        .expect(404);
    });
  });

  describe('POST /api/posts/:postId/repost', () => {
    let originalPostId: string;

    beforeAll(async () => {
      const response = await request(app).post('/api/posts').set('Cookie', authCookie).send({
        kind: 'text',
        text: 'Original post for repost',
      });
      originalPostId = response.body.id;
    });

    it('should create a repost', async () => {
      const response = await request(app)
        .post(`/api/posts/${originalPostId}/repost`)
        .set('Cookie', authCookie)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('authorId', userId);
      expect(response.body).toHaveProperty('repostOf');
      expect(response.body.repostOf.originalPostId).toBe(originalPostId);
    });

    it('should reject duplicate repost', async () => {
      // First repost
      await request(app)
        .post(`/api/posts/${originalPostId}/repost`)
        .set('Cookie', authCookie)
        .expect(201);

      // Try to repost again
      await request(app)
        .post(`/api/posts/${originalPostId}/repost`)
        .set('Cookie', authCookie)
        .expect(409);
    });

    it('should reject repost without authentication', async () => {
      await request(app).post(`/api/posts/${originalPostId}/repost`).expect(401);
    });

    it('should return 404 for repost of non-existent post', async () => {
      await request(app)
        .post('/api/posts/00000000-0000-0000-0000-000000000000/repost')
        .set('Cookie', authCookie)
        .expect(404);
    });
  });
});
