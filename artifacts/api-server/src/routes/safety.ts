import { Router, type IRouter, type Request, type Response } from 'express';
import { SafetyService } from '../services/safetyService';
import { requireAuth } from '../middlewares/auth';
import { z } from 'zod';

const router: IRouter = Router();
const safetyService = new SafetyService();

// Validation schemas
const CreateReportSchema = z.object({
  type: z.enum(['user', 'post', 'comment']),
  targetId: z.string().uuid(),
  reason: z.enum(['harassment', 'hateSpeech', 'spam', 'inappropriateContent', 'impersonation', 'violence', 'selfHarm', 'other']),
  description: z.string().max(500).optional(),
});

const BlockUserSchema = z.object({
  targetUserId: z.string().uuid(),
});

const MuteUserSchema = z.object({
  targetUserId: z.string().uuid(),
});

/**
 * POST /reports
 * Report a user, post, or comment
 */
router.post('/reports', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const input = CreateReportSchema.parse(req.body);
    const report = await safetyService.createReport(userId, input);

    res.status(201).json({
      id: report.id,
      reporterId: report.reporterId,
      type: report.type,
      targetId: report.targetId,
      reason: report.reason,
      description: report.description,
      status: report.status,
      createdAt: report.createdAt.toISOString(),
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({ message: 'Invalid request' });
    } else {
      res.status(400).json({ message: 'Failed to create report' });
    }
  }
});

/**
 * POST /blocks
 * Block a user
 */
router.post('/blocks', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const input = BlockUserSchema.parse(req.body);
    const block = await safetyService.blockUser(userId, input.targetUserId);

    res.status(201).json({
      id: block.id,
      blockerId: block.blockerId,
      blockedUserId: block.blockedUserId,
      createdAt: block.createdAt.toISOString(),
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Cannot block yourself') {
      res.status(400).json({ message: 'Cannot block yourself' });
    } else if (error instanceof Error && error.message === 'User already blocked') {
      res.status(409).json({ message: 'User already blocked' });
    } else if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({ message: 'Invalid request' });
    } else {
      res.status(400).json({ message: 'Failed to block user' });
    }
  }
});

/**
 * GET /blocks
 * List blocked users
 */
router.get('/blocks', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const limitParam = req.query.limit;
    const offsetParam = req.query.offset;
    const limit = parseInt(typeof limitParam === 'string' ? limitParam : '20') || 20;
    const offset = parseInt(typeof offsetParam === 'string' ? offsetParam : '0') || 0;

    if (limit > 100) {
      res.status(400).json({ message: 'Limit cannot exceed 100' });
      return;
    }

    const result = await safetyService.listBlockedUsers(userId, limit, offset);

    res.status(200).json(result);
  } catch {
    res.status(400).json({ message: 'Failed to list blocked users' });
  }
});

/**
 * DELETE /blocks/:userId
 * Unblock a user
 */
router.delete('/blocks/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const blockedUserId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
    await safetyService.unblockUser(userId, blockedUserId);

    res.status(204).send();
  } catch {
    res.status(400).json({ message: 'Failed to unblock user' });
  }
});

/**
 * POST /mutes
 * Mute a user
 */
router.post('/mutes', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const input = MuteUserSchema.parse(req.body);
    const mute = await safetyService.muteUser(userId, input.targetUserId);

    res.status(201).json({
      id: mute.id,
      muterId: mute.muterId,
      mutedUserId: mute.mutedUserId,
      createdAt: mute.createdAt.toISOString(),
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Cannot mute yourself') {
      res.status(400).json({ message: 'Cannot mute yourself' });
    } else if (error instanceof Error && error.message === 'User already muted') {
      res.status(409).json({ message: 'User already muted' });
    } else if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({ message: 'Invalid request' });
    } else {
      res.status(400).json({ message: 'Failed to mute user' });
    }
  }
});

/**
 * GET /mutes
 * List muted users
 */
router.get('/mutes', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const limitParam = req.query.limit;
    const offsetParam = req.query.offset;
    const limit = parseInt(typeof limitParam === 'string' ? limitParam : '20') || 20;
    const offset = parseInt(typeof offsetParam === 'string' ? offsetParam : '0') || 0;

    if (limit > 100) {
      res.status(400).json({ message: 'Limit cannot exceed 100' });
      return;
    }

    const result = await safetyService.listMutedUsers(userId, limit, offset);

    res.status(200).json(result);
  } catch {
    res.status(400).json({ message: 'Failed to list muted users' });
  }
});

/**
 * DELETE /mutes/:userId
 * Unmute a user
 */
router.delete('/mutes/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const mutedUserId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
    await safetyService.unmuteUser(userId, mutedUserId);

    res.status(204).send();
  } catch {
    res.status(400).json({ message: 'Failed to unmute user' });
  }
});

export default router;
