import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from './auth';
import { db, usersTable, sessionsTable } from '@workspace/db';

// Create test app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api', authRouter);

// Skip tests if DATABASE_URL is not set
const runTests = !!process.env.DATABASE_URL;

describe.runIf(runTests)('Auth Routes', () => {
  beforeAll(async () => {
    // Clean up any existing test data
    await db.delete(sessionsTable);
    await db.delete(usersTable);
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(sessionsTable);
    await db.delete(usersTable);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user and create session', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('profile');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.user).not.toHaveProperty('passwordHash');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should reject duplicate email registration', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
        })
        .expect(201);

      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password456',
        })
        .expect(409);
    });

    it('should reject invalid email format', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);
    });

    it('should reject password shorter than 8 characters', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test2@example.com',
          password: 'short',
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // First register a user
      await request(app).post('/api/auth/register').send({
        email: 'login@example.com',
        password: 'password123',
      });

      // Then login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('profile');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should reject wrong password for existing user', async () => {
      await request(app).post('/api/auth/register').send({
        email: 'wrongpass@example.com',
        password: 'correctpassword',
      });

      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrongpass@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout authenticated user', async () => {
      // Register and login
      const registerResponse = await request(app).post('/api/auth/register').send({
        email: 'logout@example.com',
        password: 'password123',
      });

      const sessionCookie = registerResponse.headers['set-cookie'][0];

      // Logout
      await request(app).post('/api/auth/logout').set('Cookie', sessionCookie).expect(204);
    });

    it('should reject logout without authentication', async () => {
      await request(app).post('/api/auth/logout').expect(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user profile', async () => {
      // Register and login
      const registerResponse = await request(app).post('/api/auth/register').send({
        email: 'me@example.com',
        password: 'password123',
      });

      const sessionCookie = registerResponse.headers['set-cookie'][0];

      // Get current user
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('profile');
      expect(response.body.user.email).toBe('me@example.com');
    });

    it('should reject request without authentication', async () => {
      await request(app).get('/api/auth/me').expect(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh session expiration', async () => {
      // Register and login
      const registerResponse = await request(app).post('/api/auth/register').send({
        email: 'refresh@example.com',
        password: 'password123',
      });

      const sessionCookie = registerResponse.headers['set-cookie'][0];

      // Refresh session
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('profile');
    });

    it('should reject refresh without authentication', async () => {
      await request(app).post('/api/auth/refresh').expect(401);
    });
  });
});
