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

    // Get all assignments created by this teacher
    const assignments = await prisma.assignment.findMany({
      where: {
        teacherId: user.userId,
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            questions: true,
            studentAttempts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to match the expected format
    const formattedAssignments = assignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate.toISOString(),
      isPublished: true, // Assuming published if it exists
      course: {
        id: assignment.course.id,
        name: assignment.course.name,
      },
      _count: {
        questions: assignment._count.questions,
        submissions: assignment._count.studentAttempts,
      },
    }));

    return NextResponse.json({
      success: true,
      data: formattedAssignments,
    });
  } catch (error: any) {
    console.error('[Teacher Assignments API] Error:', error);
    
    // P2021 = table does not exist yet (migration pending)
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch assignments',
    }, { status: 500 });
  }
}
