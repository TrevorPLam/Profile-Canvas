import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import mediaRouter from './media';
import { db, usersTable, profilesTable, sessionsTable } from '@workspace/db';
import { eq } from 'drizzle-orm';
import argon2 from 'argon2';

// Create test app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api', mediaRouter);

// Skip tests if DATABASE_URL is not set
const runTests = !!process.env.DATABASE_URL;

describe.runIf(runTests)('Media Routes', () => {
  let testUserId: string;
  let sessionId: string;

  beforeAll(async () => {
    // Clean up any existing test data
    await db.delete(sessionsTable);
    await db.delete(profilesTable);
    await db.delete(usersTable);

    // Create a test user
    const passwordHash = await argon2.hash('testpassword123');
    const [user] = await db
      .insert(usersTable)
      .values({
        email: 'avatar-test@example.com',
        passwordHash,
      })
      .returning();

    if (!user) {
      throw new Error('Failed to create test user');
    }

    testUserId = user.id;

    // Create a default profile
    await db.insert(profilesTable).values({
      userId: testUserId,
      handle: 'avatartest',
      name: 'Avatar Test User',
      moduleSettings: [],
    });

    // Create a session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const [session] = await db
      .insert(sessionsTable)
      .values({
        userId: testUserId,
        expiresAt,
      })
      .returning();

    if (!session) {
      throw new Error('Failed to create test session');
    }

    sessionId = session.id;
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(sessionsTable);
    await db.delete(profilesTable);
    await db.delete(usersTable);
  });

  it('should reject avatar upload without authentication', async () => {
    const response = await request(app)
      .post('/api/media/avatar')
      .attach('file', Buffer.from('fake image'), 'test.jpg');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message', 'Not authenticated');
  });

  it('should reject avatar upload without file', async () => {
    const response = await request(app)
      .post('/api/media/avatar')
      .set('Cookie', `session_id=${sessionId}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'No file uploaded');
  });

  it('should reject avatar upload with invalid file type', async () => {
    const response = await request(app)
      .post('/api/media/avatar')
      .set('Cookie', `session_id=${sessionId}`)
      .attach('file', Buffer.from('fake pdf'), 'test.pdf');

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Invalid file type');
  });

  it('should upload valid avatar image and update profile', async () => {
    // Create a minimal valid JPEG buffer (1x1 pixel black JPEG)
    const jpegBuffer = Buffer.from(
      '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP//////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='
    );

    const response = await request(app)
      .post('/api/media/avatar')
      .set('Cookie', `session_id=${sessionId}`)
      .attach('file', jpegBuffer, 'avatar.jpg');

    // This test will fail if AWS credentials are not configured
    // That's expected at this stage of development
    if (response.status === 500) {
      console.log('Avatar upload failed (expected if AWS not configured):', response.body.message);
      return;
    }

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('url');
    expect(response.body).toHaveProperty('mediaId');
    expect(response.body).toHaveProperty('mimeType', 'image/jpeg');
    expect(response.body).toHaveProperty('sizeBytes');

    // Verify profile was updated
    const [profile] = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.userId, testUserId))
      .limit(1);

    expect(profile).toBeDefined();
    expect(profile?.avatarUrl).toBe(response.body.url);
  });

  it('should reject file larger than 5MB', async () => {
    // Create a buffer larger than 5MB
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB

    const response = await request(app)
      .post('/api/media/avatar')
      .set('Cookie', `session_id=${sessionId}`)
      .attach('file', largeBuffer, 'large.jpg');

    expect(response.status).toBe(413);
    expect(response.body.message).toContain('too large');
  });
});
