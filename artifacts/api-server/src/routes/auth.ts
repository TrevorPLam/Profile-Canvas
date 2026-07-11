import { Router, type IRouter } from 'express';
import cookieParser from 'cookie-parser';
import { AuthService } from '../services/authService';
import { requireAuth } from '../middlewares/auth';
import {
  RegisterBodySchema,
  LoginBodySchema,
  GetMeResponseSchema,
} from '@workspace/api-zod';

const router: IRouter = Router();
const authService = new AuthService();

// Middleware to parse cookies
router.use(cookieParser());

/**
 * POST /auth/register
 * Register a new user with email and password
 */
router.post('/register', async (req, res) => {
  try {
    const input = RegisterBodySchema.parse(req.body);

    const result = await authService.register(input);

    // Set HTTP-only session cookie
    res.cookie('session_id', result.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    const response = GetMeResponseSchema.parse({
      user: result.user,
      profile: result.profile,
    });

    res.status(201).json(response);
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === '23505') {
      // Unique constraint violation (email already exists)
      res.status(409).json({ message: 'Email already registered' });
    } else if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({ message: 'Invalid request' });
    } else {
      res.status(400).json({ message: 'Registration failed' });
    }
  }
});

/**
 * POST /auth/login
 * Log in with email and password
 */
router.post('/login', async (req, res) => {
  try {
    const input = LoginBodySchema.parse(req.body);

    const result = await authService.login(input);

    // Set HTTP-only session cookie
    res.cookie('session_id', result.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    const response = GetMeResponseSchema.parse({
      user: result.user,
      profile: result.profile,
    });

    res.status(200).json(response);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Invalid credentials') {
      res.status(401).json({ message: 'Invalid credentials' });
    } else if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({ message: 'Invalid request' });
    } else {
      res.status(400).json({ message: 'Login failed' });
    }
  }
});

/**
 * POST /auth/logout
 * Log out current session
 */
router.post('/logout', requireAuth, async (req, res) => {
  try {
    const sessionId = req.cookies?.session_id;
    if (sessionId) {
      await authService.logout(sessionId);
    }

    // Clear session cookie
    res.clearCookie('session_id', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    res.status(204).send();
  } catch {
    res.status(400).json({ message: 'Logout failed' });
  }
});

/**
 * GET /auth/me
 * Get current authenticated user
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const sessionId = req.cookies?.session_id;
    if (!sessionId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const result = await authService.refreshSession(sessionId);

    if (!result) {
      res.status(401).json({ message: 'Invalid or expired session' });
      return;
    }

    const response = GetMeResponseSchema.parse({
      user: result.user,
      profile: result.profile,
    });

    res.status(200).json(response);
  } catch {
    res.status(400).json({ message: 'Failed to get user' });
  }
});

/**
 * POST /auth/refresh
 * Refresh session expiration
 */
router.post('/refresh', requireAuth, async (req, res) => {
  try {
    const sessionId = req.cookies?.session_id;
    if (!sessionId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const result = await authService.refreshSession(sessionId);

    if (!result) {
      res.status(401).json({ message: 'Invalid or expired session' });
      return;
    }

    // Update session cookie with new expiration
    res.cookie('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    const response = GetMeResponseSchema.parse({
      user: result.user,
      profile: result.profile,
    });

    res.status(200).json(response);
  } catch {
    res.status(400).json({ message: 'Failed to refresh session' });
  }
});

export default router;
