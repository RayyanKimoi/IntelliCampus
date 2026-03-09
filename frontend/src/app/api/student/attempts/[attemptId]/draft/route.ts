import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/student/attempts/:attemptId/draft
 * Auto-save draft content for an assignment attempt
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);
    const { attemptId } = await params;

    const body = await req.json();
    const { codeContent, textContent, labReportContent, language, files } = body;

    // Verify the attempt belongs to this student
    const attempt = await prisma.studentAttempt.findUnique({
      where: { id: attemptId, studentId: user.userId },
    });

    if (!attempt) {
      return NextResponse.json(
        { success: false, error: 'Attempt not found' },
        { status: 404 }
      );
    }

    if (attempt.submittedAt) {
      return NextResponse.json(
        { success: false, error: 'Cannot save draft after submission' },
        { status: 400 }
      );
    }

    // Build the draft data structure
    const draftData: any = {
      ...(attempt.answers as any || {}),
      draft: {
        codeContent,
        textContent,
        labReportContent,
        language,
        files,
        lastSaved: new Date().toISOString(),
      },
    };

    // Update the attempt with draft data
    const updated = await prisma.studentAttempt.update({
      where: { id: attemptId },
      data: {
        answers: draftData,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        lastSaved: draftData.draft.lastSaved,
      },
      message: 'Draft saved successfully',
    });
  } catch (error: any) {
    console.error('[Student Attempt Draft API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save draft' },
      { status: 500 }
    );
  }
}
