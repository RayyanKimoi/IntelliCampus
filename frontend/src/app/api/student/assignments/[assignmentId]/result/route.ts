import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/student/assignments/[assignmentId]/result
 * Returns the student's submission with full evaluation details:
 * - submission content (text, code, file)
 * - AI evaluation results
 * - teacher feedback
 * - rubric scores
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> },
) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);
    const { assignmentId } = await params;

    const attempt: any = await (prisma.studentAttempt as any).findFirst({
      where: {
        assignmentId,
        studentId: user.userId,
      },
      orderBy: { submittedAt: 'desc' },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            description: true,
            dueDate: true,
            rubric: true,
            evaluationPoints: true,
            courseId: true,
            course: { select: { name: true } },
            chapter: { select: { name: true } },
          },
        },
        grader: {
          select: { name: true },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { success: false, error: 'No submission found for this assignment' },
        { status: 404 }
      );
    }

    // Determine status
    let status: 'submitted' | 'ai_graded' | 'teacher_verified' = 'submitted';
    if (attempt.gradedAt) {
      status = 'teacher_verified';
    } else if (attempt.aiGraded) {
      status = 'ai_graded';
    }

    return NextResponse.json({
      success: true,
      data: {
        attemptId: attempt.id,
        assignmentId: attempt.assignmentId,
        assignment: {
          title: attempt.assignment.title,
          description: attempt.assignment.description,
          dueDate: attempt.assignment.dueDate?.toISOString(),
          courseName: attempt.assignment.course?.name,
          chapterName: attempt.assignment.chapter?.name,
          rubric: attempt.assignment.rubric,
          evaluationPoints: attempt.assignment.evaluationPoints,
        },
        submission: {
          answers: attempt.answers,
          submissionFileUrl: attempt.submissionFileUrl,
          submittedAt: attempt.submittedAt?.toISOString(),
        },
        evaluation: {
          status,
          score: attempt.score,
          rubricScores: attempt.rubricScores,
          aiEvaluation: attempt.aiEvaluation,
          aiGraded: attempt.aiGraded,
          teacherComment: attempt.teacherComment,
          gradedAt: attempt.gradedAt?.toISOString(),
          gradedBy: attempt.grader?.name || null,
        },
      },
    });
  } catch (error: any) {
    console.error('[Student Assignment Result API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch result' },
      { status: 500 }
    );
  }
}
