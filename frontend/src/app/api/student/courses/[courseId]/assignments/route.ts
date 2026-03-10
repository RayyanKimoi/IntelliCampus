import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);
    const { courseId } = await params;

    // Verify the course exists and belongs to the student's institution
    const course = await prisma.course.findFirst({
      where: { id: courseId, institutionId: user.institutionId },
      select: { id: true },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    const assignments: any = await (prisma.assignment.findMany as any)({
      where: { courseId, isPublished: true },
      include: {
        course: { select: { id: true, name: true } },
        chapter: { select: { id: true, name: true } },
        _count: { select: { questions: true } },
        studentAttempts: {
          where: { studentId: user.userId },
          orderBy: { submittedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    const formattedAssignments = assignments.map((assignment: any) => {
      const latestAttempt = assignment.studentAttempts[0];
      const isPastDue = new Date(assignment.dueDate) < new Date();

      let status: 'pending' | 'submitted' | 'graded' | 'late' = 'pending';
      if (latestAttempt) {
        status = latestAttempt.gradedAt ? 'graded' : 'submitted';
      } else if (isPastDue) {
        status = 'late';
      }

      return {
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
        type: assignment.type as 'assignment' | 'quiz',
        submissionTypes: assignment.submissionTypes,
        rubric: assignment.rubric,
        strictMode: assignment.strictMode,
      };
    });

    return NextResponse.json({ success: true, data: formattedAssignments });
  } catch (error: any) {
    console.error('[Student Course Assignments API] Error:', error);
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      return NextResponse.json({ success: true, data: [] });
    }
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch assignments' }, { status: 500 });
  }
}
