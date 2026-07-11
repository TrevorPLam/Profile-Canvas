import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import feedRouter from './feed';
import authRouter from './auth';
import { db, usersTable, sessionsTable, postsTable, friendshipsTable } from '@workspace/db';

// Create test app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRouter);
app.use('/api/feed', feedRouter);

// Skip tests if DATABASE_URL is not set
const runTests = !!process.env.DATABASE_URL;

describe.runIf(runTests)('Feed Routes', () => {
  let authCookie: string;

  beforeAll(async () => {
    // Clean up any existing test data
    await db.delete(postsTable);
    await db.delete(friendshipsTable);
    await db.delete(sessionsTable);
    await db.delete(usersTable);

    // Register a test user and get auth cookie
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'feedtest@example.com',
        password: 'password123',
      })
      .expect(201);

    authCookie = registerResponse.headers['set-cookie'][0];
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(postsTable);
    await db.delete(friendshipsTable);
    await db.delete(sessionsTable);
    await db.delete(usersTable);
  });

  describe('GET /api/feed', () => {
    it('should return feed with default pagination', async () => {
      const response = await request(app).get('/api/feed').set('Cookie', authCookie).expect(200);

      expect(response.body).toHaveProperty('posts');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('offset');
      expect(response.body.limit).toBe(20);
      expect(response.body.offset).toBe(0);
    });

    it('should return feed with custom pagination', async () => {
      const response = await request(app)
        .get('/api/feed?limit=10&offset=5')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.limit).toBe(10);
      expect(response.body.offset).toBe(5);
    });

    it('should return 400 for invalid limit', async () => {
      const response = await request(app)
        .get('/api/feed?limit=0')
        .set('Cookie', authCookie)
        .expect(400);

      expect(response.body).toEqual({ error: 'Limit must be between 1 and 100' });
    });

    it('should return 400 for limit > 100', async () => {
      const response = await request(app)
        .get('/api/feed?limit=101')
        .set('Cookie', authCookie)
        .expect(400);

      expect(response.body).toEqual({ error: 'Limit must be between 1 and 100' });
    });

    it('should return 400 for negative offset', async () => {
      const response = await request(app)
        .get('/api/feed?offset=-1')
        .set('Cookie', authCookie)
        .expect(400);

      expect(response.body).toEqual({ error: 'Offset must be non-negative' });
    });

    it('should return 401 without auth', async () => {
      await request(app).get('/api/feed').expect(401);
    });
  });

  describe('GET /api/feed/recommended', () => {
    it('should return recommended feed with default pagination', async () => {
      const response = await request(app)
        .get('/api/feed/recommended')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body).toHaveProperty('posts');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('offset');
      expect(response.body.limit).toBe(20);
      expect(response.body.offset).toBe(0);
    });

    it('should return recommended feed with custom pagination', async () => {
      const response = await request(app)
        .get('/api/feed/recommended?limit=10&offset=5')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.limit).toBe(10);
      expect(response.body.offset).toBe(5);
    });

    it('should return 400 for invalid limit', async () => {
      const response = await request(app)
        .get('/api/feed/recommended?limit=0')
        .set('Cookie', authCookie)
        .expect(400);

      expect(response.body).toEqual({ error: 'Limit must be between 1 and 100' });
    });

    it('should return 401 without auth', async () => {
      await request(app).get('/api/feed/recommended').expect(401);
    });
  });
});
