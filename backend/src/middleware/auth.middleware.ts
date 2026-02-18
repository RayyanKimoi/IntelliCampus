import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/jwt';
import { AuthTokenPayload } from '@intellicampus/shared';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Authentication required. Provide a Bearer token.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
}
