import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/student/practice/weak-courses
// Returns an array of courseIds that have at least one weak concept for this student.
// Used by the My Courses page to show the "Weak Topics" badge.
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);

    // Get all weak concept names for this student
    const weakConceptRecords = await (prisma as any).conceptMastery.findMany({
      where: { studentId: user.userId, isWeak: true },
      select: { concept: true },
    });

    if (weakConceptRecords.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const weakConceptNames: string[] = weakConceptRecords.map((r: any) => r.concept as string);

    // Find all quizzes for this student that contain at least one weak concept
    const quizzesWithWeakConcepts = await (prisma as any).quizQuestion.findMany({
      where: {
        concept: { in: weakConceptNames },
        quiz: { studentId: user.userId, courseId: { not: null } },
      },
      select: { quiz: { select: { courseId: true } } },
      distinct: ['quizId'],
    });

    const courseIds = Array.from(
      new Set(
        quizzesWithWeakConcepts
          .map((r: any) => r.quiz?.courseId as string | null)
          .filter(Boolean)
      )
    );

    return NextResponse.json({ success: true, data: courseIds });
  } catch (error: any) {
    const status =
      error.message?.includes('Authentication') ? 401 :
      error.message?.includes('permissions') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch weak courses' },
      { status }
    );
  }
}
