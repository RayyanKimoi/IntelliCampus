import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { analyticsService } from '../services/analytics.service';
import { accessibilityService } from '../services/accessibility.service';
import { sendSuccess, sendError, asyncHandler, parsePagination } from '../utils/helpers';
import { updateAIPolicySchema, updateAccessibilitySchema } from '../utils/validators';
import { prisma } from '../config/db';

// ========================
// Dashboard
// ========================

export const getAdminDashboard = asyncHandler(async (req: Request, res: Response) => {
  const dashboard = await analyticsService.getAdminDashboard(req.user!.institutionId);
  sendSuccess(res, dashboard);
});

// ========================
// User Management
// ========================

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
  const role = req.query.role as string | undefined;

  const { users, total } = await userService.listUsers(req.user!.institutionId, {
    role,
    skip,
    take: limit,
  });

  res.json({
    success: true,
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.params.userId as string);
  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }
  sendSuccess(res, user);
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await userService.deleteUser(req.params.userId as string);
  sendSuccess(res, null, 'User deleted');
});

// ========================
// AI Policy / Governance
// ========================

export const getAIPolicy = asyncHandler(async (req: Request, res: Response) => {
  const policy = await prisma.aIPolicySettings.findUnique({
    where: { institutionId: req.user!.institutionId },
  });

  if (!policy) {
    // Create default
    const newPolicy = await prisma.aIPolicySettings.create({
      data: {
        institutionId: req.user!.institutionId,
      },
    });
    sendSuccess(res, newPolicy);
    return;
  }

  sendSuccess(res, policy);
});

export const updateAIPolicy = asyncHandler(async (req: Request, res: Response) => {
  const parsed = updateAIPolicySchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, parsed.error.errors[0].message, 400);
    return;
  }

  const policy = await prisma.aIPolicySettings.upsert({
    where: { institutionId: req.user!.institutionId },
    create: {
      institutionId: req.user!.institutionId,
      ...parsed.data,
    },
    update: parsed.data,
  });

  sendSuccess(res, policy, 'AI policy updated');
});

// ========================
// Accessibility Management
// ========================

export const getStudentAccessibility = asyncHandler(async (req: Request, res: Response) => {
  const settings = await accessibilityService.getSettings(req.params.studentId as string);
  sendSuccess(res, settings);
});

export const updateStudentAccessibility = asyncHandler(async (req: Request, res: Response) => {
  const parsed = updateAccessibilitySchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, parsed.error.errors[0].message, 400);
    return;
  }

  const settings = await accessibilityService.adminSetStudentAccessibility(
    req.params.studentId as string,
    parsed.data
  );
  sendSuccess(res, settings, 'Student accessibility updated');
});

// ========================
// System Usage
// ========================

export const getSystemUsage = asyncHandler(async (req: Request, res: Response) => {
  const logs = await prisma.systemUsageLog.findMany({
    where: {
      user: { institutionId: req.user!.institutionId },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });
  sendSuccess(res, logs);
});

// ========================
// Institution management
// ========================

export const getInstitution = asyncHandler(async (req: Request, res: Response) => {
  const institution = await prisma.institution.findFirst({
    where: { id: req.user!.institutionId },
    include: {
      _count: {
        select: { users: true, courses: true },
      },
    },
  });
  sendSuccess(res, institution);
});
