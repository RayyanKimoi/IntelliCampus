import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);

    const submissions = await prisma.studentAttempt.findMany({
      where: { studentId: user.userId, submittedAt: { not: null } },
      include: {
        assignment: { select: { id: true, title: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    const formattedSubmissions = submissions.map((submission: any) => ({
      id: submission.id,
      assignmentId: submission.assignmentId,
      assignmentTitle: submission.assignment.title,
      submittedAt: submission.submittedAt?.toISOString() || new Date().toISOString(),
      score: submission.score || undefined,
      totalPoints: 100,
      status: submission.gradedAt ? 'graded' : 'submitted',
      teacherComment: submission.teacherComment || undefined,
      textContent: (submission.answers as any)?.textContent || undefined,
      attachmentUrl: submission.submissionFileUrl || undefined,
    }));

    return NextResponse.json({ success: true, data: formattedSubmissions });
  } catch (error: any) {
    console.error('[Student Submissions API] Error:', error);
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      return NextResponse.json({ success: true, data: [] });
    }
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch submissions',
    }, { status: 500 });
  }
}
