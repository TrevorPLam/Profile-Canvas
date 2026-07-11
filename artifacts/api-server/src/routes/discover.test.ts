import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import discoverRouter from './discover';
import authRouter from './auth';
import friendsRouter from './friends';
import { db, usersTable, sessionsTable, postsTable, profilesTable, friendRequestsTable, friendshipsTable } from '@workspace/db';

// Create test app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRouter);
app.use('/api/friends', friendsRouter);
app.use('/api/discover', discoverRouter);

describe('Discover Routes', () => {
  let authCookie: string;

  beforeAll(async () => {
    // Clean up any existing test data
    await db.delete(postsTable);
    await db.delete(friendshipsTable);
    await db.delete(friendRequestsTable);
    await db.delete(profilesTable);
    await db.delete(sessionsTable);
    await db.delete(usersTable);

    // Register a test user and get auth cookie
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'discovertest@example.com',
        password: 'password123',
      })
      .expect(201);

    authCookie = registerResponse.headers['set-cookie'][0];
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(postsTable);
    await db.delete(friendshipsTable);
    await db.delete(friendRequestsTable);
    await db.delete(profilesTable);
    await db.delete(sessionsTable);
    await db.delete(usersTable);
  });

  describe('GET /api/discover/trending', () => {
    it('should return trending feed with default pagination', async () => {
      const response = await request(app)
        .get('/api/discover/trending')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body).toHaveProperty('posts');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('offset');
      expect(response.body.limit).toBe(20);
      expect(response.body.offset).toBe(0);
    });

    it('should return trending feed with custom pagination', async () => {
      const response = await request(app)
        .get('/api/discover/trending?limit=10&offset=5')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.limit).toBe(10);
      expect(response.body.offset).toBe(5);
    });

    it('should return 400 for invalid limit', async () => {
      const response = await request(app)
        .get('/api/discover/trending?limit=0')
        .set('Cookie', authCookie)
        .expect(400);

      expect(response.body).toEqual({ error: 'Limit must be between 1 and 100' });
    });

    it('should return 400 for limit > 100', async () => {
      const response = await request(app)
        .get('/api/discover/trending?limit=101')
        .set('Cookie', authCookie)
        .expect(400);

      expect(response.body).toEqual({ error: 'Limit must be between 1 and 100' });
    });

    it('should return 400 for negative offset', async () => {
      const response = await request(app)
        .get('/api/discover/trending?offset=-1')
        .set('Cookie', authCookie)
        .expect(400);

      expect(response.body).toEqual({ error: 'Offset must be non-negative' });
    });

    it('should return 401 without auth', async () => {
      await request(app).get('/api/discover/trending').expect(401);
    });
  });

  describe('GET /api/discover', () => {
    it('should return search results with default pagination', async () => {
      const response = await request(app)
        .get('/api/discover')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body).toHaveProperty('posts');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('offset');
      expect(response.body.limit).toBe(20);
      expect(response.body.offset).toBe(0);
    });

    it('should return search results with query parameter', async () => {
      const response = await request(app)
        .get('/api/discover?q=test')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body).toHaveProperty('posts');
    });

    it('should return search results with topic parameter', async () => {
      const response = await request(app)
        .get('/api/discover?topic=technology')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body).toHaveProperty('posts');
    });

    it('should return search results with custom pagination', async () => {
      const response = await request(app)
        .get('/api/discover?limit=10&offset=5')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.limit).toBe(10);
      expect(response.body.offset).toBe(5);
    });

    it('should return 400 for invalid limit', async () => {
      const response = await request(app)
        .get('/api/discover?limit=0')
        .set('Cookie', authCookie)
        .expect(400);

      expect(response.body).toEqual({ error: 'Limit must be between 1 and 100' });
    });

    it('should return 400 for negative offset', async () => {
      const response = await request(app)
        .get('/api/discover?offset=-1')
        .set('Cookie', authCookie)
        .expect(400);

      expect(response.body).toEqual({ error: 'Offset must be non-negative' });
    });

    it('should return 401 without auth', async () => {
      await request(app).get('/api/discover').expect(401);
    });
  });

  describe('GET /api/discover/people', () => {
    it('should return people suggestions with default pagination', async () => {
      const response = await request(app)
        .get('/api/discover/people')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body).toHaveProperty('profiles');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('offset');
      expect(response.body.limit).toBe(20);
      expect(response.body.offset).toBe(0);
      expect(Array.isArray(response.body.profiles)).toBe(true);
    });

    it('should return people suggestions with custom pagination', async () => {
      const response = await request(app)
        .get('/api/discover/people?limit=10&offset=5')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.limit).toBe(10);
      expect(response.body.offset).toBe(5);
    });

    it('should return 400 for invalid limit', async () => {
      const response = await request(app)
        .get('/api/discover/people?limit=0')
        .set('Cookie', authCookie)
        .expect(400);

      expect(response.body).toEqual({ error: 'Limit must be between 1 and 100' });
    });

    it('should return 400 for limit > 100', async () => {
      const response = await request(app)
        .get('/api/discover/people?limit=101')
        .set('Cookie', authCookie)
        .expect(400);

      expect(response.body).toEqual({ error: 'Limit must be between 1 and 100' });
    });

    it('should return 400 for negative offset', async () => {
      const response = await request(app)
        .get('/api/discover/people?offset=-1')
        .set('Cookie', authCookie)
        .expect(400);

      expect(response.body).toEqual({ error: 'Offset must be non-negative' });
    });

    it('should return 401 without auth', async () => {
      await request(app).get('/api/discover/people').expect(401);
    });

    it('should exclude friends from suggestions', async () => {
      // Register another user
      const user2Response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'user2@example.com',
          password: 'password123',
        })
        .expect(201);

      const user2Cookie = user2Response.headers['set-cookie'][0];

      // Get user2's ID from the response
      const user2MeResponse = await request(app)
        .get('/api/auth/me')
        .set('Cookie', user2Cookie)
        .expect(200);

      const user2Id = user2MeResponse.body.user.id;

      // Send friend request from user1 to user2
      await request(app)
        .post('/api/friends/requests')
        .set('Cookie', authCookie)
        .send({ receiverId: user2Id })
        .expect(201);

      // Accept the friend request
      await request(app)
        .post(`/api/friends/requests/${user2Id}`)
        .set('Cookie', user2Cookie)
        .expect(200);

      // Get suggestions - user2 should not be in the list
      const suggestionsResponse = await request(app)
        .get('/api/discover/people')
        .set('Cookie', authCookie)
        .expect(200);

      const suggestedUserIds = suggestionsResponse.body.profiles.map((p: { userId: string }) => p.userId);
      expect(suggestedUserIds).not.toContain(user2Id);
    });

    it('should exclude users with pending requests from suggestions', async () => {
      // Register another user
      const user3Response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'user3@example.com',
          password: 'password123',
        })
        .expect(201);

      const user3Cookie = user3Response.headers['set-cookie'][0];

      // Get user3's ID from the response
      const user3MeResponse = await request(app)
        .get('/api/auth/me')
        .set('Cookie', user3Cookie)
        .expect(200);

      const user3Id = user3MeResponse.body.user.id;

      // Send friend request from user1 to user3 (pending)
      await request(app)
        .post('/api/friends/requests')
        .set('Cookie', authCookie)
        .send({ receiverId: user3Id })
        .expect(201);

      // Get suggestions - user3 should not be in the list
      const suggestionsResponse = await request(app)
        .get('/api/discover/people')
        .set('Cookie', authCookie)
        .expect(200);

      const suggestedUserIds = suggestionsResponse.body.profiles.map((p: { userId: string }) => p.userId);
      expect(suggestedUserIds).not.toContain(user3Id);
    });
  });

  describe('GET /api/discover/profiles', () => {
    it('should return profile search results with query', async () => {
      const response = await request(app)
        .get('/api/discover/profiles?q=test')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body).toHaveProperty('profiles');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('offset');
      expect(Array.isArray(response.body.profiles)).toBe(true);
    });

    it('should return 400 when query parameter is missing', async () => {
      const response = await request(app)
        .get('/api/discover/profiles')
        .set('Cookie', authCookie)
        .expect(400);

      expect(response.body).toEqual({ error: 'Query parameter "q" is required' });
    });

    it('should return profile search results with custom pagination', async () => {
      const response = await request(app)
        .get('/api/discover/profiles?q=test&limit=10&offset=5')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.limit).toBe(10);
      expect(response.body.offset).toBe(5);
    });

    it('should return 400 for invalid limit', async () => {
      const response = await request(app)
        .get('/api/discover/profiles?q=test&limit=0')
        .set('Cookie', authCookie)
        .expect(400);

      expect(response.body).toEqual({ error: 'Limit must be between 1 and 100' });
    });

    it('should return 400 for negative offset', async () => {
      const response = await request(app)
        .get('/api/discover/profiles?q=test&offset=-1')
        .set('Cookie', authCookie)
        .expect(400);

      expect(response.body).toEqual({ error: 'Offset must be non-negative' });
    });

    it('should return 401 without auth', async () => {
      await request(app).get('/api/discover/profiles?q=test').expect(401);
    });

    it('should return empty results for non-matching query', async () => {
      const response = await request(app)
        .get('/api/discover/profiles?q=nonexistenthandle12345')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.profiles).toEqual([]);
      expect(response.body.total).toBe(0);
    });
  });
});
