import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/reports/filters
 * Fetches all filter options for the teacher (courses, chapters, assignments, students)
 */
export async function GET(req: NextRequest) {
  try {
    // Authentication
    let user;
    try {
      user = getAuthUser(req);
      requireRole(user, [UserRole.TEACHER]);
    } catch (authError: any) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: authError.message || 'Authentication failed' },
        { status: 401 }
      );
    }

    const userId = user.userId;

    // Get teacher's courses
    const teacherCourses = await prisma.course.findMany({
      where: {
        OR: [
          { createdBy: userId },
          { teacherAssignments: { some: { teacherId: userId } } }
        ]
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' }
    });

    const courseIds = teacherCourses.map(c => c.id);

    // Get chapters for these courses
    const chapters = await prisma.chapter.findMany({
      where: { courseId: { in: courseIds } },
      select: {
        id: true,
        name: true,
        courseId: true,
      },
      orderBy: [{ courseId: 'asc' }, { orderIndex: 'asc' }]
    });

    // Get assignments for these courses
    const assignments = await prisma.assignment.findMany({
      where: { courseId: { in: courseIds } },
      select: {
        id: true,
        title: true,
        courseId: true,
        chapterId: true,
        type: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get students enrolled in these courses
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { courseId: { in: courseIds } },
      select: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      distinct: ['studentId']
    });

    const students = enrollments.map(e => e.student);

    return NextResponse.json({
      courses: teacherCourses,
      chapters,
      assignments,
      students
    });

  } catch (error) {
    console.error('Error fetching report filters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filters' },
      { status: 500 }
    );
  }
}
