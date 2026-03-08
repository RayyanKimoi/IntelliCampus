import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.TEACHER]);
    console.log('[API] Teacher courses requested by:', user.email);

    // Get teacher's assigned courses from database
    const teacherAssignments = await prisma.teacherCourseAssignment.findMany({
      where: { teacherId: user.userId },
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

    const courses = teacherAssignments.map((assignment) => ({
      id: assignment.course.id,
      name: assignment.course.name,
      description: assignment.course.description,
      institutionId: assignment.course.institutionId,
      createdBy: assignment.course.createdBy,
      createdAt: assignment.course.createdAt.toISOString(),
      _count: assignment.course._count,
    }));

    console.log(`[API] Found ${courses.length} courses for teacher`);
    return NextResponse.json(courses, { status: 200 });
  } catch (error: any) {
    console.error('[API] /api/teacher/curriculum/courses error:', error);
    
    const isAuthError = error.message?.includes('Authentication required') || 
                        error.message?.includes('Invalid or expired token');
    const isPermissionError = error.message?.includes('Insufficient permissions');
    
    const statusCode = isAuthError ? 401 : isPermissionError ? 403 : 500;
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: statusCode }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.TEACHER, UserRole.ADMIN]);

    const body = await req.json();
    const { name, description, institutionId } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Course name is required' },
        { status: 400 }
      );
    }

    // Get teacher's institution if not provided
    const teacherInstitutionId = institutionId || (await prisma.user.findUnique({
      where: { id: user.userId },
      select: { institutionId: true },
    }))?.institutionId;

    if (!teacherInstitutionId) {
      return NextResponse.json(
        { error: 'Institution ID not found' },
        { status: 400 }
      );
    }

    // Create course
    const course = await prisma.course.create({
      data: {
        name,
        description: description || '',
        institutionId: teacherInstitutionId,
        createdBy: user.userId,
      },
      include: {
        _count: {
          select: {
            chapters: true,
            assignments: true,
          },
        },
      },
    });

    // Assign course to teacher
    await prisma.teacherCourseAssignment.create({
      data: {
        teacherId: user.userId,
        courseId: course.id,
      },
    });

    console.log(`[API] Course created: ${course.id} by ${user.email}`);
    return NextResponse.json(course, { status: 201 });
  } catch (error: any) {
    console.error('[API] POST /api/teacher/curriculum/courses error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create course' },
      { status: 500 }
    );
  }
}
