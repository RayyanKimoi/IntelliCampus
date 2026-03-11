import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.TEACHER]);

    const body = await req.json();
    const {
      title, description, courseId, chapterId, dueDate,
      type = 'assignment', submissionTypes = [], rubric,
      assignmentDocumentUrl, evaluationPoints,
    } = body;

    if (!title || !courseId || !dueDate) {
      return NextResponse.json({ success: false, error: 'title, courseId and dueDate are required' }, { status: 400 });
    }

    if (!chapterId) {
      return NextResponse.json({ success: false, error: 'chapterId is required - please select a chapter' }, { status: 400 });
    }

    const assignment = await (prisma.assignment as any).create({
      data: {
        title,
        description: description || '',
        courseId,
        chapterId: chapterId || null,
        teacherId: user.userId,
        dueDate: new Date(dueDate),
        type,
        submissionTypes,
        rubric: rubric ?? null,
        assignmentDocumentUrl: assignmentDocumentUrl || null,
        evaluationPoints: evaluationPoints != null ? String(evaluationPoints) : '',
        isPublished: false,
      },
      include: {
        course: { select: { id: true, name: true } },
        _count: { select: { questions: true, studentAttempts: true } },
      },
    });

    return NextResponse.json({ success: true, data: assignment }, { status: 201 });
  } catch (error: any) {
    console.error('[Teacher Assignments API] POST error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create assignment' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check authentication and authorization
    const user = getAuthUser(req);
    requireRole(user, [UserRole.TEACHER]);

    // Get all assignments created by this teacher
    const assignments = await (prisma.assignment as any).findMany({
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

    const formattedAssignments = assignments.map((a: any) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      type: a.type ?? 'assignment',
      dueDate: a.dueDate.toISOString(),
      isPublished: a.isPublished ?? false,
      submissionTypes: a.submissionTypes ?? [],
      rubric: a.rubric ?? null,
      chapterId: a.chapterId ?? null,
      assignmentDocumentUrl: a.assignmentDocumentUrl ?? null,
      evaluationPoints: a.evaluationPoints ?? '',
      course: { id: a.course.id, name: a.course.name },
      _count: { questions: a._count.questions, submissions: a._count.studentAttempts },
    }));

    return NextResponse.json({ success: true, data: formattedAssignments });
  } catch (error: any) {
    console.error('[Teacher Assignments API] Error:', error);
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      return NextResponse.json({ success: true, data: [] });
    }
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch assignments' }, { status: 500 });
  }
}
