import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/jwt';
import { UserRole } from '@intellicampus/shared';
import { logger } from '@/utils/logger';

const SALT_ROUNDS = 12;

export class UserService {
  /**
   * Register a new user
   */
  async register(data: {
    name: string;
    email: string;
    password: string;
    role: string;
    institutionId: string;
  }) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new Error('Email already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role as any,
        institutionId: data.institutionId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        institutionId: true,
      },
    });

    // Create profile and accessibility settings
    await prisma.userProfile.create({
      data: { userId: user.id },
    });

    await prisma.accessibilitySettings.create({
      data: { userId: user.id },
    });

    // If student, create XP record
    if (data.role === 'student') {
      await prisma.studentXP.create({
        data: { userId: user.id },
      });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role as unknown as UserRole,
      institutionId: user.institutionId,
    });

    logger.info('UserService', `User registered: ${user.email}`);

    return { user, token };
  }

  /**
   * Login user
   */
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role as unknown as UserRole,
      institutionId: user.institutionId,
    });

    logger.info('UserService', `User logged in: ${user.email}`);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        institutionId: user.institutionId,
      },
      token,
    };
  }

  /**
   * Get user by ID with profile
   */
  async getUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        institutionId: true,
        createdAt: true,
        profile: true,
        accessibilitySettings: true,
      },
    });
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: {
      avatarUrl?: string;
      yearOfStudy?: number;
      department?: string;
      bio?: string;
    }
  ) {
    return prisma.userProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  /**
   * List users by institution and optional role filter
   */
  async listUsers(
    institutionId: string,
    filters: { role?: string; skip?: number; take?: number }
  ) {
    const where: any = { institutionId };
    if (filters.role) where.role = filters.role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: filters.skip || 0,
        take: filters.take || 20,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string) {
    await prisma.user.delete({ where: { id: userId } });
    logger.info('UserService', `User deleted: ${userId}`);
  }
}

export const userService = new UserService();
