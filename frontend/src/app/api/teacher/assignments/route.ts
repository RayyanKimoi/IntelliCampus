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
      courseId: assignment.courseId,
      chapterId: assignment.chapterId,
      teacherId: assignment.teacherId,
      title: assignment.title,
      description: assignment.description || '',
      type: (assignment.type as 'assignment' | 'quiz') || 'assignment',
      dueDate: assignment.dueDate.toISOString(),
      isPublished: true, // Assuming published if it exists
      submissionTypes: assignment.submissionTypes || null,
      rubric: assignment.rubric as any || null,
      assignmentDocumentUrl: assignment.assignmentDocumentUrl || null,
      evaluationPoints: assignment.evaluationPoints || null,
      createdAt: assignment.createdAt.toISOString(),
      course: {
        id: assignment.course.id,
        name: assignment.course.name,
      },
      _count: {
        questions: assignment._count.questions,
        studentAttempts: assignment._count.studentAttempts,
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

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.TEACHER]);

    const body = await req.json();
    const { courseId, chapterId, title, description, type, dueDate, submissionTypes, rubric, assignmentDocumentUrl, evaluationPoints } = body;

    if (!courseId || !title || !dueDate) {
      return NextResponse.json({ success: false, error: 'courseId, title, and dueDate are required' }, { status: 400 });
    }

    const assignment = await prisma.assignment.create({
      data: {
        courseId,
        chapterId: chapterId || null,
        teacherId: user.userId,
        title,
        description: description || '',
        type: type || 'assignment',
        dueDate: new Date(dueDate),
        submissionTypes: submissionTypes || null,
        rubric: rubric || null,
        assignmentDocumentUrl: assignmentDocumentUrl || null,
        evaluationPoints: evaluationPoints || null,
        isPublished: false,
      },
      include: {
        course: { select: { id: true, name: true } },
        chapter: { select: { id: true, name: true } },
        _count: { select: { questions: true, studentAttempts: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...assignment,
        dueDate: assignment.dueDate.toISOString(),
        createdAt: assignment.createdAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Teacher Assignments API] POST Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create assignment',
    }, { status: 500 });
  }
}
