import { NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check authentication and authorization
    const user = getAuthUser();
    requireRole(user, [UserRole.TEACHER]);

    // Get courses assigned to this teacher
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
              },
            },
          },
        },
      },
    });

    const courses = assignments.map((assignment) => assignment.course);

    return NextResponse.json({
      success: true,
      data: courses,
    });
  } catch (error: any) {
    console.error('API Error:', error);
    
    const isAuthError = error.message?.includes('Authentication required') || 
                        error.message?.includes('Invalid or expired token');
    const statusCode = isAuthError ? 401 : 500;
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch courses' },
      { status: statusCode }
    );
  }
}
