// ========================
// User & Auth Types
// ========================

export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  institutionId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  avatarUrl?: string;
  yearOfStudy?: number;
  department?: string;
  bio?: string;
}

export interface AccessibilitySettings {
  id: string;
  userId: string;
  adhdMode: boolean;
  dyslexiaFont: boolean;
  highContrast: boolean;
  speechEnabled: boolean;
  focusMode: boolean;
  fontScale: number;
  updatedAt: Date;
}

export interface Institution {
  id: string;
  name: string;
  domain: string;
  createdAt: Date;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  institutionId: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  institutionId: string;
}

export interface AuthResponse {
  user: Omit<User, 'createdAt' | 'updatedAt'>;
  token: string;
}
