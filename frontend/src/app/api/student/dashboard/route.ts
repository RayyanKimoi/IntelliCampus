import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { analyticsService } from '@/services/analytics.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, ['student']);
    
    const dashboard = await analyticsService.getStudentDashboard(user.userId);
    return NextResponse.json(
      { success: true, data: dashboard },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message.includes('Authentication') ? 401 : error.message.includes('permissions') ? 403 : 400 }
    );
  }
}
