import { NextRequest } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { gamificationService } from '@/services/gamification.service';
import { createErrorResponse, createSuccessResponse } from '@/utils/helpers';
import { UserRole } from '@intellicampus/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);

    const limit = Math.max(3, Number(req.nextUrl.searchParams.get('limit')) || 10);
    const leaderboard = await gamificationService.getWeeklyLeaderboard(user.userId, limit);
    return createSuccessResponse(leaderboard);
  } catch (error: any) {
    return createErrorResponse(
      error.message || 'Failed to load leaderboard',
      error.message?.includes('Authentication') ? 401 : 400
    );
  }
}