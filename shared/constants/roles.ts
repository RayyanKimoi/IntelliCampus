import { UserRole } from '../types/user';

export const ROLES = {
  STUDENT: UserRole.STUDENT,
  TEACHER: UserRole.TEACHER,
  ADMIN: UserRole.ADMIN,
} as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.STUDENT]: 'Student',
  [UserRole.TEACHER]: 'Teacher',
  [UserRole.ADMIN]: 'Admin',
};

export const ROLE_PERMISSIONS = {
  [UserRole.STUDENT]: [
    'view:courses',
    'view:assignments',
    'submit:assignments',
    'use:ai-chat',
    'view:own-analytics',
    'play:gamification',
  ],
  [UserRole.TEACHER]: [
    'view:courses',
    'manage:courses',
    'manage:curriculum',
    'manage:assignments',
    'view:student-analytics',
    'view:class-insights',
  ],
  [UserRole.ADMIN]: [
    'manage:users',
    'manage:institution',
    'manage:governance',
    'manage:accessibility',
    'view:system-analytics',
    'manage:ai-policy',
  ],
} as const;
