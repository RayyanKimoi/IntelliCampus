import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  // Handle authentication separately so auth errors return 401, not 500
  let user: any;
  try {
    user = getAuthUser(req);
    requireRole(user, [UserRole.TEACHER, UserRole.ADMIN]);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const { assignmentId } = await params;

    // Verify the assignment exists and get course info
    const assignment: any = await (prisma.assignment.findUnique as any)({
      where: { id: assignmentId },
      select: { teacherId: true, courseId: true },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Skip ownership check for dev mode (userId = 'teacher-dev') or admin
    const isDevMode = user.userId === 'teacher-dev' || user.userId === 'dev-user';
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isDevMode && !isAdmin && assignment.teacherId !== user.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Fetch all submission attempts for this assignment
    const attempts: any[] = await (prisma.studentAttempt.findMany as any)({
      where: {
        assignmentId,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
        studentAnswers: true,
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    // Also fetch enrolled students who have NOT submitted, so the teacher
    // can see all students (including non-submitters) in the grading view
    const enrollments: any[] = await (prisma.courseEnrollment.findMany as any)({
      where: { courseId: assignment.courseId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    // Build a set of student IDs that already have attempts
    const attemptStudentIds = new Set(attempts.map((a: any) => a.studentId));

    // Create placeholder entries for enrolled students who haven't submitted
    const nonSubmittedEntries: any[] = enrollments
      .filter((e: any) => !attemptStudentIds.has(e.studentId))
      .map((e: any) => ({
        id: `pending-${e.studentId}`,
        assignmentId,
        studentId: e.studentId,
        score: 0,
        answers: null,
        submissionFileUrl: null,
        startedAt: null,
        submittedAt: null,
        integrityFlag: false,
        gradedAt: null,
        gradedBy: null,
        teacherComment: null,
        rubricScores: null,
        student: e.student,
        studentAnswers: [],
        notSubmitted: true,
      }));

    const allResults = [...attempts, ...nonSubmittedEntries];

    return NextResponse.json({ success: true, data: allResults });
  } catch (error) {
    console.error('[API] Error fetching assignment results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignment results' },
      { status: 500 }
    );
  }
}
