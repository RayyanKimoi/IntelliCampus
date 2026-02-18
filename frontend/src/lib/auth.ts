import { NextRequest } from 'next/server';
import { verifyToken } from './jwt';
import { AuthTokenPayload } from '@intellicampus/shared';

export function getAuthUser(req: NextRequest): AuthTokenPayload {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authentication required. Provide a Bearer token.');
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const payload = verifyToken(token);
    return payload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export function requireRole(user: AuthTokenPayload, allowedRoles: string[]): void {
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Insufficient permissions');
  }
}
