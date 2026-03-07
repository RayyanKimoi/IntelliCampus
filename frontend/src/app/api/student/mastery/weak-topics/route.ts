import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { masteryService } from '@/services/mastery.service';
import { MASTERY } from '@intellicampus/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);

    const records = await masteryService.getStudentMastery(user.userId);

    const weakTopics = records
      .filter((r) => r.masteryScore < MASTERY.WEAK_THRESHOLD)
      .map((r) => ({
        topicId: r.topicId,
        topicName: r.topic.name,
        subjectName: r.topic.subject.name,
        courseName: (r.topic.subject as any).course?.name ?? '',
        masteryLevel: Math.round(r.masteryScore),
        lastAssessed: (r as any).updatedAt?.toISOString(),
      }));

    return NextResponse.json({ success: true, data: weakTopics }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      {
        status: error.message.includes('Authentication') ? 401
          : error.message.includes('permissions') ? 403
          : 500,
      }
    );
  }
}
