import { NextRequest } from 'next/server';
import { verifyToken } from './jwt';
import { AuthTokenPayload, UserRole } from '@intellicampus/shared';

export function getAuthUser(req: NextRequest): AuthTokenPayload {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authentication required. Provide a Bearer token.');
  }

  const token = authHeader.split(' ')[1];
  
  // In development mode, accept mock token and detect role from URL
  if (token === 'dev-token-mock-authentication') {
    const url = req.nextUrl.pathname;
    
    // Detect role from URL path
    if (url.includes('/api/admin/')) {
      return {
        userId: 'admin-dev',
        email: 'admin@intellicampus.edu',
        role: UserRole.ADMIN,
        institutionId: 'admin',
      };
    } else if (url.includes('/api/teacher/')) {
      return {
        userId: 'teacher-dev',
        email: 'teacher@intellicampus.edu',
        role: UserRole.TEACHER,
        institutionId: 'dev-institution',
      };
    } else if (url.includes('/api/student/')) {
      return {
        userId: 'student-dev',
        email: 'student@intellicampus.edu',
        role: UserRole.STUDENT,
        institutionId: 'dev-institution',
      };
    }
    
    // Default to teacher for backward compatibility
    return {
      userId: 'dev-user',
      email: 'teacher@intellicampus.edu',
      role: UserRole.TEACHER,
      institutionId: 'dev-institution',
    };
  }
  
  try {
    const payload = verifyToken(token);
    return payload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export function requireRole(user: AuthTokenPayload, allowedRoles: UserRole[]): void {
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Insufficient permissions');
  }
}
