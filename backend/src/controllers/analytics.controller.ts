import { Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';
import { sendSuccess, asyncHandler } from '../utils/helpers';

/**
 * General analytics endpoints used across roles
 */

export const getStudentPerformance = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.params.studentId as string) || req.user!.userId;
  const dashboard = await analyticsService.getStudentDashboard(userId);
  sendSuccess(res, dashboard);
});

export const getPerformanceTrend = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.params.studentId as string) || req.user!.userId;
  const days = parseInt(req.query.days as string) || 30;
  const trend = await analyticsService.getPerformanceTrend(userId, days);
  sendSuccess(res, trend);
});

export const logUsage = asyncHandler(async (req: Request, res: Response) => {
  const log = await analyticsService.logUsage(
    req.user!.userId,
    req.body.actionType,
    req.body.metadata
  );
  sendSuccess(res, log, 'Usage logged');
});
