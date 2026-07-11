import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';

// Extend Express Request type to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const authService = new AuthService();

/**
 * requireAuth middleware
 * Verifies session cookie and attaches userId to request
 * Returns 401 if session is invalid or expired
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const sessionId = req.cookies?.session_id;

  if (!sessionId) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  const userId = await authService.verifySession(sessionId);

  if (!userId) {
    res.status(401).json({ message: 'Invalid or expired session' });
    return;
  }

  req.userId = userId;
  next();
}

/**
 * optionalAuth middleware
 * Attaches userId to request if session is valid, but doesn't require it
 * Useful for endpoints that work for both authenticated and unauthenticated users
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const sessionId = req.cookies?.session_id;

  if (sessionId) {
    const userId = await authService.verifySession(sessionId);
    if (userId) {
      req.userId = userId;
    }
  }

  next();
}
