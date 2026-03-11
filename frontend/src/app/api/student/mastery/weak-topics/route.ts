import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WEAK_THRESHOLD = 70;

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);

    const records = await (prisma as any).conceptMastery.findMany({
      where: {
        studentId: user.userId,
        masteryScore: { lt: WEAK_THRESHOLD },
      },
      orderBy: { masteryScore: 'asc' },
    });

    const weakTopics = records.map((r: any) => ({
      topicId: r.id,
      topicName: r.concept,
      courseName: '',
      masteryLevel: Math.round(r.masteryScore),
      attempts: r.totalCount,
      correct: r.correctCount,
      lastAssessed: r.updatedAt?.toISOString(),
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
