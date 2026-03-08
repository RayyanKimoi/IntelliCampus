import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.TEACHER]);

    const { courseId } = await params;

    const enrollments = await prisma.courseEnrollment.findMany({
      where: { courseId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            masteryGraphs: {
              include: {
                topic: {
                  include: {
                    subject: { select: { courseId: true } },
                  },
                },
              },
            },
            studentAttempts: {
              where: {
                assignment: { courseId },
                submittedAt: { not: null },
              },
              select: { score: true },
              orderBy: { score: 'desc' },
            },
          },
        },
      },
    });

    // Load existing evaluations for this course
    const evaluations = await prisma.studentEvaluation.findMany({
      where: { courseId },
    });
    const evalMap = new Map(evaluations.map((e) => [e.studentId, e]));

    const students = enrollments.map(({ student }) => {
      const relevantMastery = student.masteryGraphs.filter(
        (m) => m.topic.subject.courseId === courseId
      );
      const avgMastery =
        relevantMastery.length > 0
          ? relevantMastery.reduce((sum, m) => sum + m.masteryScore, 0) /
            relevantMastery.length
          : null;

      const bestAttemptScore =
        student.studentAttempts.length > 0
          ? student.studentAttempts[0].score
          : null;

      const evaluation = evalMap.get(student.id);

      return {
        studentId: student.id,
        name: student.name,
        email: student.email,
        masteryScore:
          avgMastery !== null ? Math.round(avgMastery * 10) / 10 : null,
        assignmentScore: bestAttemptScore,
        evaluationScore: evaluation?.score ?? null,
        feedback: evaluation?.feedback ?? null,
        gradedAt: evaluation?.gradedAt ?? null,
      };
    });

    return NextResponse.json({ success: true, data: students });
  } catch (error: any) {
    console.error('[Teacher Students API] Error:', error);

    // P2021 = table does not exist yet (migration pending)
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      return NextResponse.json({ success: true, data: [] });
    }

    const isAuth =
      error.message?.includes('Authentication') ||
      error.message?.includes('token');
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load students' },
      { status: isAuth ? 401 : 500 }
    );
  }
}
