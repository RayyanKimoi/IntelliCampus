import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> },
) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);
    const { assignmentId } = await params;

    const assignment: any = await (prisma.assignment.findUnique as any)({
      where: { id: assignmentId },
      include: {
        course: { select: { id: true, name: true } },
        chapter: { select: { id: true, name: true } },
        questions: {
          select: {
            id: true,
            questionText: true,
            optionA: true,
            optionB: true,
            optionC: true,
            optionD: true,
            correctOption: true,
            difficultyLevel: true,
            topicId: true,
          },
        },
        studentAttempts: {
          where: { studentId: user.userId },
          orderBy: { submittedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!assignment || !assignment.isPublished) {
      return NextResponse.json({ success: false, error: 'Assignment not found' }, { status: 404 });
    }

    const latestAttempt = assignment.studentAttempts[0];
    const isPastDue = new Date(assignment.dueDate) < new Date();

    let status: 'pending' | 'submitted' | 'graded' | 'late' = 'pending';
    if (latestAttempt) {
      status = latestAttempt.gradedAt ? 'graded' : 'submitted';
    } else if (isPastDue) {
      status = 'late';
    }

    return NextResponse.json({
      success: true,
      data: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate.toISOString(),
        courseId: assignment.courseId,
        subjectId: assignment.chapterId || assignment.courseId,
        courseName: assignment.course.name,
        subjectName: assignment.chapter?.name || assignment.course.name,
        status,
        totalPoints: assignment.evaluationPoints || 100,
        score: latestAttempt?.score || undefined,
        instructions: assignment.description,
        attachmentUrl: assignment.assignmentDocumentUrl || undefined,
        submissionTypes: assignment.submissionTypes,
        rubric: assignment.rubric,
        type: assignment.type as 'assignment' | 'quiz',
        strictMode: assignment.strictMode,
        questions: assignment.questions.map((q: any) => ({
          id: q.id,
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctOption: latestAttempt ? q.correctOption : undefined,
          topicId: q.topicId || undefined,
          difficultyLevel: q.difficultyLevel,
        })),
      },
    });
  } catch (error: any) {
    console.error('[Student Assignment Detail API] Error:', error);
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      return NextResponse.json({ success: true, data: null });
    }
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch assignment',
    }, { status: 500 });
  }
}