import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.TEACHER]);

    const { courseId } = await context.params;

    // Get course with chapters from database
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          include: {
            _count: {
              select: {
                content: true,
              },
            },
          },
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const result = {
      courseName: course.name,
      chapters: course.chapters.map((chapter) => ({
        id: chapter.id,
        courseId: chapter.courseId,
        name: chapter.name,
        description: chapter.description,
        orderIndex: chapter.orderIndex,
        createdAt: chapter.createdAt.toISOString(),
        updatedAt: chapter.updatedAt.toISOString(),
        _count: chapter._count,
      })),
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('[API] /api/teacher/curriculum/courses/[courseId]/chapters error:', error);
    
    // Check for specific authentication/authorization errors
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

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.TEACHER]);

    const { courseId } = await context.params;
    const body = await req.json();
    const { name, description, orderIndex } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Chapter name is required' },
        { status: 400 }
      );
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Get the highest order index if not provided
    let finalOrderIndex = orderIndex;
    if (finalOrderIndex === undefined) {
      const lastChapter = await prisma.chapter.findFirst({
        where: { courseId },
        orderBy: { orderIndex: 'desc' },
      });
      finalOrderIndex = (lastChapter?.orderIndex || 0) + 1;
    }

    // Create chapter
    const chapter = await prisma.chapter.create({
      data: {
        courseId,
        name,
        description: description || '',
        orderIndex: finalOrderIndex,
      },
      include: {
        _count: {
          select: {
            content: true,
          },
        },
      },
    });

    console.log(`[API] Chapter created: ${chapter.id} for course ${courseId}`);
    return NextResponse.json(chapter, { status: 201 });
  } catch (error: any) {
    console.error('[API] POST /api/teacher/curriculum/courses/[courseId]/chapters error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create chapter' },
      { status: 500 }
    );
  }
}
