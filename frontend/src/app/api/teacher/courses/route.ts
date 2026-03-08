import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Check authentication and authorization
    const user = getAuthUser(req);
    requireRole(user, [UserRole.TEACHER]);

    // Get courses assigned to this teacher with enrollment counts
    const assignments = await prisma.teacherCourseAssignment.findMany({
      where: {
        teacherId: user.userId,
      },
      include: {
        course: {
          include: {
            _count: {
              select: {
                chapters: true,
                assignments: true,
                enrollments: true,
              },
            },
          },
        },
      },
    });

    const courses = assignments.map((assignment) => ({
      ...assignment.course,
      studentCount: assignment.course._count.enrollments,
    }));

    return NextResponse.json({
      success: true,
      data: courses,
    });
  } catch (error: any) {
    console.error('[Teacher Courses API] Error:', error);
    
    // P2021 = table does not exist yet (migration pending)
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      return NextResponse.json({ success: true, data: [] });
    }

    const isAuthError = error.message?.includes('Authentication required') || 
                        error.message?.includes('Invalid or expired token');
    const statusCode = isAuthError ? 401 : 500;
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch courses' },
      { status: statusCode }
    );
  }
}
