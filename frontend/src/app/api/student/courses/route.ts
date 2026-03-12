import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/student/courses
 * Returns ONLY the courses the authenticated student is enrolled in.
 */
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);

    // Find courses where this student has an active enrollment
    const courses = await prisma.course.findMany({
      where: {
        enrollments: { some: { studentId: user.userId } },
      },
      select: {
        id: true,
        name: true,
        description: true,
        _count: {
          select: {
            assignments: { where: { isPublished: true } },
            chapters: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = courses.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      assignmentCount: c._count.assignments,
      chapterCount: c._count.chapters,
    }));

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error('[Student Courses API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      {
        status: error.message?.includes('Authentication') ? 401
          : error.message?.includes('permissions') ? 403
          : 500,
      },
    );
  }
}
