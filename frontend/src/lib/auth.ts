import { NextRequest } from 'next/server';
import { verifyToken } from './jwt';
import { AuthTokenPayload } from '@intellicampus/shared';

// Mock user for development when JWT verification fails
// TODO: Make this configurable via environment variable
const isDevelopment = true; // Always use dev mode with mock auth for now

const DEV_MOCK_USER: AuthTokenPayload = {
  userId: 'dev-user-id',
  email: 'teacher@dev.com',
  role: 'teacher',
  institutionId: 'dev-institution',
};

export function getAuthUser(req: NextRequest): AuthTokenPayload {
  const authHeader = req.headers.get('authorization');

  // In development mode, allow mock authentication
  if (isDevelopment) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[Auth] No token in dev mode, using mock user');
      return DEV_MOCK_USER;
    }

    const token = authHeader.split(' ')[1];
    
    // Check if it's the dev mock token
    if (token === 'dev-token-mock-authentication') {
      console.log('[Auth] Dev mock token detected, using mock user');
      return DEV_MOCK_USER;
    }
    
    try {
      const payload = verifyToken(token);
      return payload;
    } catch (error) {
      console.log('[Auth] Token verification failed in dev mode, using mock user');
      return DEV_MOCK_USER;
    }
  }

  // Production mode - strict authentication
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
