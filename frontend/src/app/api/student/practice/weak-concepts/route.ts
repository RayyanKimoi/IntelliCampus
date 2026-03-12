import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/student/practice/weak-concepts
// Returns all concepts where the student scores < 60% (isWeak = true)
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    // If courseId is provided, only return concepts that appeared in quizzes for that course
    let allowedConcepts: string[] | null = null;
    if (courseId) {
      const courseQuizConcepts = await (prisma as any).quizQuestion.findMany({
        where: { quiz: { studentId: user.userId, courseId } },
        select: { concept: true },
        distinct: ['concept'],
      });
      allowedConcepts = courseQuizConcepts.map((r: any) => r.concept as string);
    }

    const whereClause: any = { studentId: user.userId, isWeak: true };
    if (allowedConcepts !== null) {
      if (allowedConcepts.length === 0) {
        return NextResponse.json({ success: true, data: [] });
      }
      whereClause.concept = { in: allowedConcepts };
    }

    const records = await (prisma as any).conceptMastery.findMany({
      where: whereClause,
      orderBy: { masteryScore: 'asc' },
    });

    // Count distinct quiz sessions per concept (not individual questions)
    const conceptQuizRows = await (prisma as any).quizQuestion.findMany({
      where: {
        quiz: { studentId: user.userId, ...(courseId ? { courseId } : {}) },
        concept: { in: records.map((r: any) => r.concept) },
      },
      select: { quizId: true, concept: true },
      distinct: ['quizId', 'concept'],
    });

    const quizSessionMap: Record<string, number> = {};
    for (const row of conceptQuizRows) {
      quizSessionMap[row.concept] = (quizSessionMap[row.concept] ?? 0) + 1;
    }

    const data = records.map((r: any) => ({
      id: r.concept,
      name: r.concept,
      masteryScore: Math.round(r.masteryScore),
      correctCount: r.correctCount,
      totalCount: r.totalCount,
      attempts: quizSessionMap[r.concept] ?? 0,
      lastUpdated: r.updatedAt?.toISOString(),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    const status =
      error.message?.includes('Authentication') ? 401 :
      error.message?.includes('permissions') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch weak concepts' },
      { status }
    );
  }
}
