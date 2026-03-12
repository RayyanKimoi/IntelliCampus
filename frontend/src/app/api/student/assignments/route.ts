import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/student/assignments?courseId=
 * Returns published assignments (type=assignment) for enrolled courses.
 * If courseId is provided, results are scoped to that course.
 */
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);

    const courseId = req.nextUrl.searchParams.get('courseId') ?? undefined;

    // Get all enrolled course IDs for this student
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { studentId: user.userId },
      select: { courseId: true },
    });
    const enrolledCourseIds = enrollments.map((e) => e.courseId);

    if (enrolledCourseIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // If a specific courseId is requested, verify enrollment
    if (courseId && !enrolledCourseIds.includes(courseId)) {
      return NextResponse.json({ success: false, error: 'Not enrolled in this course' }, { status: 403 });
    }

    const rawAssignments = await (prisma.assignment as any).findMany({
      where: {
        isPublished: true,
        type: 'assignment',
        courseId: courseId
          ? courseId
          : { in: enrolledCourseIds },
      },
      include: {
        course: { select: { id: true, name: true } },
        chapter: { select: { id: true, name: true } },
        studentAttempts: {
          where: { studentId: user.userId },
          orderBy: { submittedAt: 'desc' },
          take: 1,
          select: { id: true, score: true, submittedAt: true, gradedAt: true, teacherComment: true, aiGraded: true, aiEvaluation: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    const assignments = rawAssignments.map((a: any) => {
      const attempt = a.studentAttempts?.[0];
      const isPastDue = new Date(a.dueDate) < new Date();
      let status: 'pending' | 'submitted' | 'graded' | 'late' = 'pending';
      if (attempt) {
        status = attempt.gradedAt ? 'graded' : 'submitted';
      } else if (isPastDue) {
        status = 'late';
      }
      return {
        id: a.id,
        title: a.title,
        description: a.description,
        dueDate: a.dueDate.toISOString(),
        courseId: a.courseId,
        subjectId: a.chapterId || a.courseId,
        courseName: a.course?.name ?? '',
        chapterName: a.chapter?.name ?? null,
        subjectName: a.chapter?.name || a.course?.name || '',
        status,
        totalPoints: a.evaluationPoints || 100,
        score: attempt?.score ?? undefined,
        instructions: a.description,
        attachmentUrl: a.assignmentDocumentUrl || undefined,
        type: a.type,
        submissionTypes: a.submissionTypes,
        rubric: a.rubric,
        strictMode: a.strictMode,
        aiGraded: attempt?.aiGraded ?? false,
        teacherComment: attempt?.teacherComment ?? null,
        attemptId: attempt?.id ?? null,
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
