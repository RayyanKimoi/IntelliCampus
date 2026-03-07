import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { masteryService } from '@/services/mastery.service';
import { MASTERY } from '@intellicampus/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);

    const records = await masteryService.getCourseMastery(user.userId, courseId);

    const byTopic = records.map((r) => ({
      topicId: r.topicId,
      topicName: r.topic.name,
      subjectName: (r.topic as any).subject?.name ?? '',
      courseName: '',
      masteryLevel: Math.round(r.masteryScore),
      lastAssessed: (r as any).updatedAt?.toISOString(),
    }));

    const overallMastery = byTopic.length > 0
      ? Math.round(byTopic.reduce((sum, t) => sum + t.masteryLevel, 0) / byTopic.length)
      : 0;

    const weakTopics = byTopic.filter((t) => t.masteryLevel < MASTERY.WEAK_THRESHOLD);

    return NextResponse.json(
      { success: true, data: { overallMastery, byTopic, weakTopics } },
      { status: 200 }
    );
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
