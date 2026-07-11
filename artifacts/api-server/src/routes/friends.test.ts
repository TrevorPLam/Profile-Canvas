import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import friendsRouter from './friends';

// Mock the auth middleware
vi.mock('../middlewares/auth', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.userId = 'test-user-id';
    next();
  },
}));

// Mock the friendship service
vi.mock('../services/friendshipService', () => ({
  friendshipService: {
    sendRequest: vi.fn(),
    acceptRequest: vi.fn(),
    declineRequest: vi.fn(),
    cancelRequest: vi.fn(),
    listRequests: vi.fn(),
    listFriends: vi.fn(),
    removeFriend: vi.fn(),
    setTopFriends: vi.fn(),
    getTopFriends: vi.fn(),
    areFriends: vi.fn(),
  },
}));

import { friendshipService } from '../services/friendshipService';

const app = express();
app.use(express.json());
app.use('/friends', friendsRouter);

describe('Friendship Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /friends/requests', () => {
    it('should send a friend request successfully', async () => {
      (friendshipService.sendRequest as any).mockResolvedValue({
        id: 'request-id',
        senderId: 'test-user-id',
        receiverId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const response = await request(app)
        .post('/friends/requests')
        .send({ targetUserId: '550e8400-e29b-41d4-a716-446655440000' });

      expect(response.status).toBe(201);
      expect(friendshipService.sendRequest).toHaveBeenCalledWith('test-user-id', '550e8400-e29b-41d4-a716-446655440000');
      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('pending');
    });

    it('should return 409 if request already exists', async () => {
      (friendshipService.sendRequest as any).mockResolvedValue(null);

      const response = await request(app)
        .post('/friends/requests')
        .send({ targetUserId: '550e8400-e29b-41d4-a716-446655440000' });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('message', 'Friend request already exists or users are already friends');
    });

    it('should return 400 for invalid request body', async () => {
      const response = await request(app)
        .post('/friends/requests')
        .send({ targetUserId: 'invalid-uuid' });

      expect(response.status).toBe(400);
    });

    it('should return 400 when sending to self', async () => {
      (friendshipService.sendRequest as any).mockRejectedValue(
        new Error('Cannot send friend request to yourself')
      );

      const response = await request(app)
        .post('/friends/requests')
        .send({ targetUserId: '123e4567-e89b-12d3-a456-426614174000' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Cannot send friend request to yourself');
    });
  });

  describe('GET /friends/requests', () => {
    it('should list incoming friend requests', async () => {
      (friendshipService.listRequests as any).mockResolvedValue({
        requests: [
          {
            id: 'request-id',
            senderId: 'sender-id',
            receiverId: 'test-user-id',
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        total: 1,
      });

      const response = await request(app)
        .get('/friends/requests?type=incoming');

      expect(response.status).toBe(200);
      expect(friendshipService.listRequests).toHaveBeenCalledWith('test-user-id', 'incoming');
      expect(response.body.requests).toHaveLength(1);
    });

    it('should list outgoing friend requests', async () => {
      (friendshipService.listRequests as any).mockResolvedValue({
        requests: [],
        total: 0,
      });

      const response = await request(app)
        .get('/friends/requests?type=outgoing');

      expect(response.status).toBe(200);
      expect(friendshipService.listRequests).toHaveBeenCalledWith('test-user-id', 'outgoing');
    });

    it('should return 400 for invalid type parameter', async () => {
      const response = await request(app)
        .get('/friends/requests?type=invalid');

      expect(response.status).toBe(400);
    });
  });

  describe('POST /friends/requests/:requestId', () => {
    it('should accept a friend request successfully', async () => {
      (friendshipService.acceptRequest as any).mockResolvedValue({
        userId: 'test-user-id',
        friendId: 'sender-id',
        createdAt: new Date().toISOString(),
      });

      const response = await request(app)
        .post('/friends/requests/request-id');

      expect(response.status).toBe(200);
      expect(friendshipService.acceptRequest).toHaveBeenCalledWith('request-id', 'test-user-id');
    });

    it('should return 404 if request not found', async () => {
      (friendshipService.acceptRequest as any).mockResolvedValue(null);

      const response = await request(app)
        .post('/friends/requests/request-id');

      expect(response.status).toBe(404);
    });

    it('should return 403 if not authorized to accept', async () => {
      (friendshipService.acceptRequest as any).mockRejectedValue(
        new Error('Not authorized to accept this request')
      );

      const response = await request(app)
        .post('/friends/requests/request-id');

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /friends/requests/:requestId', () => {
    it('should cancel a friend request successfully', async () => {
      (friendshipService.cancelRequest as any).mockResolvedValue({
        id: 'request-id',
        senderId: 'test-user-id',
        receiverId: 'target-user-id',
        status: 'cancelled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const response = await request(app)
        .delete('/friends/requests/request-id');

      expect(response.status).toBe(204);
      expect(friendshipService.cancelRequest).toHaveBeenCalledWith('request-id', 'test-user-id');
    });

    it('should return 404 if request not found', async () => {
      (friendshipService.cancelRequest as any).mockResolvedValue(null);

      const response = await request(app)
        .delete('/friends/requests/request-id');

      expect(response.status).toBe(404);
    });

    it('should return 403 if not authorized to cancel', async () => {
      (friendshipService.cancelRequest as any).mockRejectedValue(
        new Error('Not authorized to cancel this request')
      );

      const response = await request(app)
        .delete('/friends/requests/request-id');

      expect(response.status).toBe(403);
    });
  });

  describe('POST /friends/requests/:requestId/decline', () => {
    it('should decline a friend request successfully', async () => {
      (friendshipService.declineRequest as any).mockResolvedValue({
        id: 'request-id',
        senderId: 'sender-id',
        receiverId: 'test-user-id',
        status: 'declined',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const response = await request(app)
        .post('/friends/requests/request-id/decline');

      expect(response.status).toBe(204);
      expect(friendshipService.declineRequest).toHaveBeenCalledWith('request-id', 'test-user-id');
    });

    it('should return 404 if request not found', async () => {
      (friendshipService.declineRequest as any).mockResolvedValue(null);

      const response = await request(app)
        .post('/friends/requests/request-id/decline');

      expect(response.status).toBe(404);
    });

    it('should return 403 if not authorized to decline', async () => {
      (friendshipService.declineRequest as any).mockRejectedValue(
        new Error('Not authorized to decline this request')
      );

      const response = await request(app)
        .post('/friends/requests/request-id/decline');

      expect(response.status).toBe(403);
    });
  });

  describe('GET /friends', () => {
    it('should list friends successfully', async () => {
      (friendshipService.listFriends as any).mockResolvedValue({
        friends: [
          {
            userId: 'friend-id',
            handle: 'friendhandle',
            name: 'Friend Name',
            avatarUrl: 'https://example.com/avatar.jpg',
          },
        ],
        total: 1,
      });

      const response = await request(app)
        .get('/friends');

      expect(response.status).toBe(200);
      expect(friendshipService.listFriends).toHaveBeenCalledWith('test-user-id');
      expect(response.body.friends).toHaveLength(1);
    });
  });

  describe('DELETE /friends', () => {
    it('should remove a friend successfully', async () => {
      (friendshipService.removeFriend as any).mockResolvedValue(true);

      const response = await request(app)
        .delete('/friends')
        .send({ friendUserId: '550e8400-e29b-41d4-a716-446655440000' });

      expect(response.status).toBe(204);
      expect(friendshipService.removeFriend).toHaveBeenCalledWith('test-user-id', '550e8400-e29b-41d4-a716-446655440000');
    });

    it('should return 404 if friendship not found', async () => {
      (friendshipService.removeFriend as any).mockResolvedValue(false);

      const response = await request(app)
        .delete('/friends')
        .send({ friendUserId: '550e8400-e29b-41d4-a716-446655440000' });

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid request body', async () => {
      const response = await request(app)
        .delete('/friends')
        .send({ friendUserId: 'invalid-uuid' });

      expect(response.status).toBe(400);
    });
  });
});
