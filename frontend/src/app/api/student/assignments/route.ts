import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/student/assignments
// Returns all published assignments (type=assignment) visible to the student
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);

    // Get courses the student is enrolled in
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { studentId: user.userId },
      select: { courseId: true },
    });
    const courseIds = enrollments.map((e) => e.courseId);

    const rawAssignments = await (prisma.assignment as any).findMany({
      where: {
        isPublished: true,
        type: 'assignment',
        ...(courseIds.length > 0 ? { courseId: { in: courseIds } } : {}),
      },
      include: {
        course: { select: { id: true, name: true } },
        chapter: { select: { id: true, name: true } },
        _count: { select: { questions: true } },
        studentAttempts: {
          where: { studentId: user.userId },
          orderBy: { submittedAt: 'desc' },
          take: 1,
          select: { id: true, score: true, submittedAt: true, gradedAt: true, teacherComment: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    const assignments = rawAssignments.map((assignment: any) => {
      const latestAttempt = assignment.studentAttempts?.[0];
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
        courseName: assignment.course?.name ?? '',
        subjectName: assignment.chapter?.name || assignment.course?.name || '',
        status,
        totalPoints: assignment.evaluationPoints || 100,
        score: latestAttempt?.score ?? undefined,
        instructions: assignment.description,
        attachmentUrl: assignment.assignmentDocumentUrl || undefined,
        type: assignment.type,
        submissionTypes: assignment.submissionTypes,
        rubric: assignment.rubric,
        strictMode: assignment.strictMode,
      };
    });

    return NextResponse.json({ success: true, data: assignments });
  } catch (error: any) {
    console.error('[Student Assignments API] GET error:', error);
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      return NextResponse.json({ success: true, data: [] });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
