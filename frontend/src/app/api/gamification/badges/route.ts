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

    const badges = await gamificationService.getBadges(user.userId);
    return createSuccessResponse(badges);
  } catch (error: any) {
    return createErrorResponse(
      error.message || 'Failed to load badges',
      error.message?.includes('Authentication') ? 401 : 400
    );
  }
}