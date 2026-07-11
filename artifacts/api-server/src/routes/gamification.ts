import { Router, type Request, type Response } from 'express';
import { gamificationService } from '../services/gamificationService';
import { requireAuth } from '../middlewares/auth';
import { z } from 'zod';

const router = Router();

// Zod schemas for request validation
const createPollSchema = z.object({
  postId: z.string().uuid(),
  question: z.string().min(1).max(200),
  options: z.array(
    z.object({
      id: z.string(),
      text: z.string().min(1).max(100),
    })
  ).min(2).max(10),
  expiresAt: z.string().datetime().optional(),
});

const votePollSchema = z.object({
  optionId: z.string(),
});

const createQuizSchema = z.object({
  postId: z.string().uuid(),
  questions: z.array(
    z.object({
      id: z.string(),
      text: z.string().min(1).max(200),
      options: z.array(z.string().min(1).max(100)).min(2).max(6),
      correctAnswer: z.number().int().min(0),
    })
  ).min(1).max(10),
});

const submitQuizSchema = z.object({
  answers: z.array(z.number().int().min(0)),
});

const recordStreakSchema = z.object({
  timestamp: z.string().datetime().nullable().optional(),
});

/**
 * POST /polls
 *
 * Given an authenticated user and a post, when they create a poll,
 * then the poll is attached to the post with options for voting.
 */
router.post('/polls', requireAuth, async (req: Request, res: Response) => {
  try {
    const input = createPollSchema.parse(req.body);

    const poll = await gamificationService.createPoll({
      postId: input.postId,
      question: input.question,
      options: input.options,
      expiresAt: input.expiresAt,
    });

    res.status(201).json(poll);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({ message: 'Invalid request' });
    } else if (error instanceof Error && error.message.includes('between 2 and 10')) {
      res.status(400).json({ message: error.message });
    } else {
      console.error('Error creating poll:', error);
      res.status(500).json({ message: 'Failed to create poll' });
    }
  }
});

/**
 * GET /polls/:pollId
 *
 * Given a poll ID, when requested, then the poll is returned
 * with current vote counts and percentages.
 */
router.get('/polls/:pollId', async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { pollId } = req.params;
    const pollIdStr = Array.isArray(pollId) ? pollId[0] : pollId;

    const poll = await gamificationService.getPoll(pollIdStr, userId);

    if (!poll) {
      res.status(404).json({ message: 'Poll not found' });
      return;
    }

    res.json(poll);
  } catch (error) {
    console.error('Error getting poll:', error);
    res.status(500).json({ message: 'Failed to get poll' });
  }
});

/**
 * POST /polls/:pollId/vote
 *
 * Given an authenticated user and a poll, when they vote,
 * then their vote is recorded. One vote per user per poll (idempotent).
 */
router.post('/polls/:pollId/vote', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { pollId } = req.params;
    const pollIdStr = Array.isArray(pollId) ? pollId[0] : pollId;
    const input = votePollSchema.parse(req.body);

    const poll = await gamificationService.votePoll({
      pollId: pollIdStr,
      userId,
      optionId: input.optionId,
    });

    res.json(poll);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({ message: 'Invalid request' });
    } else if (error instanceof Error && error.message === 'Poll not found') {
      res.status(404).json({ message: 'Poll not found' });
    } else if (error instanceof Error && error.message === 'Poll has expired') {
      res.status(400).json({ message: 'Poll has expired' });
    } else if (error instanceof Error && error.message === 'Invalid option') {
      res.status(400).json({ message: 'Invalid option' });
    } else {
      console.error('Error voting on poll:', error);
      res.status(500).json({ message: 'Failed to vote on poll' });
    }
  }
});

/**
 * POST /quizzes
 *
 * Given an authenticated user and a post, when they create a quiz,
 * then the quiz is attached to the post with questions and correct answers.
 */
router.post('/quizzes', requireAuth, async (req: Request, res: Response) => {
  try {
    const input = createQuizSchema.parse(req.body);

    const quiz = await gamificationService.createQuiz({
      postId: input.postId,
      questions: input.questions,
    });

    res.status(201).json(quiz);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({ message: 'Invalid request' });
    } else {
      console.error('Error creating quiz:', error);
      res.status(500).json({ message: 'Failed to create quiz' });
    }
  }
});

/**
 * GET /quizzes/:quizId
 *
 * Given a quiz ID, when requested, then the quiz is returned
 * with questions and aggregated results.
 */
router.get('/quizzes/:quizId', async (req: Request, res: Response) => {
  try {
    const _userId = req.userId;
    const { quizId } = req.params;
    const quizIdStr = Array.isArray(quizId) ? quizId[0] : quizId;

    const quiz = await gamificationService.getQuiz(quizIdStr, _userId);

    if (!quiz) {
      res.status(404).json({ message: 'Quiz not found' });
      return;
    }

    res.json(quiz);
  } catch (error) {
    console.error('Error getting quiz:', error);
    res.status(500).json({ message: 'Failed to get quiz' });
  }
});

/**
 * POST /quizzes/:quizId/submit
 *
 * Given an authenticated user and a quiz, when they submit answers,
 * then their score is calculated and stored. One submission per user per quiz.
 */
router.post('/quizzes/:quizId/submit', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { quizId } = req.params;
    const quizIdStr = Array.isArray(quizId) ? quizId[0] : quizId;
    const input = submitQuizSchema.parse(req.body);

    const quiz = await gamificationService.submitQuiz({
      quizId: quizIdStr,
      userId,
      answers: input.answers,
    });

    res.json(quiz);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({ message: 'Invalid request' });
    } else if (error instanceof Error && error.message === 'Quiz not found') {
      res.status(404).json({ message: 'Quiz not found' });
    } else {
      console.error('Error submitting quiz:', error);
      res.status(500).json({ message: 'Failed to submit quiz' });
    }
  }
});

/**
 * GET /streaks
 *
 * Given an authenticated user, when they request their streaks,
 * then all active streaks with current counts and longest streaks are returned.
 */
router.get('/streaks', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const streaks = await gamificationService.getStreaks(userId);
    res.json(streaks);
  } catch (error) {
    console.error('Error getting streaks:', error);
    res.status(500).json({ message: 'Failed to get streaks' });
  }
});

/**
 * POST /streaks/:streakId/record
 *
 * Given an authenticated user and a streak type, when they record activity,
 * then the streak count increments if within the period. Grace periods are supported.
 */
router.post('/streaks/:streakId/record', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { streakId } = req.params;
    const streakIdStr = Array.isArray(streakId) ? streakId[0] : streakId;
    const input = recordStreakSchema.parse(req.body);

    const streak = await gamificationService.recordStreakActivity({
      userId,
      streakType: streakIdStr,
      timestamp: input.timestamp || undefined,
    });

    res.json(streak);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({ message: 'Invalid request' });
    } else {
      console.error('Error recording streak activity:', error);
      res.status(500).json({ message: 'Failed to record streak activity' });
    }
  }
});

/**
 * GET /badges
 *
 * Given an authenticated user, when they request their badges,
 * then all earned badges with award dates are returned.
 */
router.get('/badges', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const badges = await gamificationService.getBadges(userId);
    res.json(badges);
  } catch (error) {
    console.error('Error getting badges:', error);
    res.status(500).json({ message: 'Failed to get badges' });
  }
});

/**
 * GET /badges/available
 *
 * Given a request, when available badges are requested,
 * then all badge definitions with criteria are returned.
 */
router.get('/badges/available', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const badges = await gamificationService.getAvailableBadges(userId);
    res.json(badges);
  } catch (error) {
    console.error('Error getting available badges:', error);
    res.status(500).json({ message: 'Failed to get available badges' });
  }
});

export default router;
