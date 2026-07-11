import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { eq } from 'drizzle-orm';
import commentsRouter from './comments';
import { db } from '@workspace/db';
import { usersTable, profilesTable, postsTable, commentsTable } from '@workspace/db';
import { AuthService } from '../services/authService';

// Skip tests if DATABASE_URL is not set (expected in development)
const runIntegrationTests = !!process.env.DATABASE_URL;

describe.runIf(runIntegrationTests)('comments routes integration tests', () => {
  let app: express.Express;
  let authService: AuthService;
  let testUser: { id: string; email: string };
  let testSession: string;
  let testPost: { id: string };

  beforeAll(async () => {
    // Set up test app
    app = express();
    app.use(express.json());
    app.use(commentsRouter);

    authService = new AuthService();

    // Create test user
    const email = `test-${Date.now()}@example.com`;
    const password = 'testpassword123';
    const user = await authService.register({ email, password });
    testUser = { id: user.userId, email };

    // Create test session
    const session = await authService.login({ email, password });
    testSession = session.sessionId;

    // Create test post
    const [post] = await db
      .insert(postsTable)
      .values({
        authorId: testUser.id,
        kind: 'text',
        content: { kind: 'text', text: 'Test post for comments' },
        topics: [],
      })
      .returning();
    testPost = { id: post.id };
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(commentsTable).where(eq(commentsTable.postId, testPost.id));
    await db.delete(postsTable).where(eq(postsTable.id, testPost.id));
    await db.delete(profilesTable).where(eq(profilesTable.userId, testUser.id));
    await db.delete(usersTable).where(eq(usersTable.id, testUser.id));
  });

  describe('GET /posts/:postId/comments', () => {
    it('should list comments for a post', async () => {
      const response = await request(app)
        .get(`/posts/${testPost.id}/comments`)
        .expect(200);

      expect(response.body).toHaveProperty('comments');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.comments)).toBe(true);
      expect(typeof response.body.total).toBe('number');
    });

    it('should support pagination with limit and offset', async () => {
      const response = await request(app)
        .get(`/posts/${testPost.id}/comments?limit=10&offset=0`)
        .expect(200);

      expect(response.body).toHaveProperty('comments');
      expect(response.body).toHaveProperty('total');
    });

    it('should return empty array for post with no comments', async () => {
      const response = await request(app)
        .get(`/posts/${testPost.id}/comments`)
        .expect(200);

      expect(response.body.comments).toEqual([]);
      expect(response.body.total).toBe(0);
    });
  });

  describe('POST /posts/:postId/comments', () => {
    it('should create a comment when authenticated', async () => {
      const response = await request(app)
        .post(`/posts/${testPost.id}/comments`)
        .set('Cookie', `session_id=${testSession}`)
        .send({ text: 'This is a test comment' })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('postId', testPost.id);
      expect(response.body).toHaveProperty('text', 'This is a test comment');
      expect(response.body).toHaveProperty('author');
      expect(response.body.author).toHaveProperty('userId', testUser.id);
      expect(response.body).toHaveProperty('createdAt');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post(`/posts/${testPost.id}/comments`)
        .send({ text: 'This is a test comment' })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for invalid request body', async () => {
      const response = await request(app)
        .post(`/posts/${testPost.id}/comments`)
        .set('Cookie', `session_id=${testSession}`)
        .send({}) // Missing text field
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent post', async () => {
      const fakePostId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .post(`/posts/${fakePostId}/comments`)
        .set('Cookie', `session_id=${testSession}`)
        .send({ text: 'This is a test comment' })
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Post not found');
    });
  });
});
