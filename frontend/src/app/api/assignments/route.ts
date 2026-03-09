/**
 * Universal Assignment Route — /api/assignments
 * Uses Supabase Service Role Key to bypass RLS for all operations.
 * Supports both JSON and multipart/form-data (for file uploads).
 *
 * POST  — Create assignment (teacher) with optional document upload
 * GET   — Fetch assignments based on authenticated role
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse submissionTypes from any format teachers/clients send:
 *   - string[]: ["code", "text", "file"]
 *   - object:   { code: true, text: false, file: true }
 * Always returns a string[] | null.
 */
function normaliseSubmissionTypes(raw: unknown): string[] | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw.filter(Boolean) as string[];
  if (typeof raw === 'object') {
    return Object.entries(raw as Record<string, boolean>)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key);
  }
  return null;
}

/**
 * Upload a File/Buffer to Supabase Storage using the service role client.
 * Uses `upsert: true` so duplicate filenames overwrite silently.
 */
async function uploadFileToSupabase(
  bucket: string,
  path: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, buffer, { contentType, upsert: true });

  if (error) {
    console.error('[assignments/route] Supabase upload error:', error);
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

// ---------------------------------------------------------------------------
// GET  /api/assignments
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);

    const url = new URL(req.url);
    const courseId = url.searchParams.get('courseId') ?? undefined;

    if (user.role === UserRole.TEACHER) {
      // Teachers see their own assignments
      const assignments = await prisma.assignment.findMany({
        where: {
          teacherId: user.userId,
          ...(courseId ? { courseId } : {}),
        },
        include: {
          course: { select: { id: true, name: true } },
          _count: { select: { questions: true, studentAttempts: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ success: true, data: assignments });
    }

    if (user.role === UserRole.STUDENT) {
      // Students see published assignments for their enrolled courses
      const { data: enrollments, error: enrollError } = await supabaseAdmin
        .from('course_enrollments')
        .select('course_id')
        .eq('student_id', user.userId);

      if (enrollError) {
        console.error('[assignments/route] Enrollment query error:', enrollError);
        return NextResponse.json({ success: true, data: [] });
      }

      const courseIds = (enrollments ?? []).map((e: any) => e.course_id);
      if (courseIds.length === 0) {
        return NextResponse.json({ success: true, data: [] });
      }

      const assignments = await prisma.assignment.findMany({
        where: {
          courseId: { in: courseIds },
          isPublished: true,
          ...(courseId ? { courseId } : {}),
        },
        include: {
          course: { select: { id: true, name: true } },
          chapter: { select: { id: true, name: true } },
          studentAttempts: {
            where: { studentId: user.userId },
            orderBy: { startedAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { dueDate: 'asc' },
      });

      const formatted = assignments.map((a: any) => {
        const attempt = a.studentAttempts[0];
        const isPastDue = new Date(a.dueDate) < new Date();
        let status: 'pending' | 'submitted' | 'graded' | 'late' = 'pending';
        if (attempt?.submittedAt) {
          status = attempt.gradedAt ? 'graded' : 'submitted';
        } else if (isPastDue) {
          status = 'late';
        }

        return {
          id: a.id,
          title: a.title,
          description: a.description,
          dueDate: a.dueDate.toISOString(),
          courseId: a.courseId,
          subjectId: a.chapterId ?? a.courseId,
          courseName: a.course.name,
          subjectName: a.chapter?.name ?? a.course.name,
          type: a.type as 'assignment' | 'quiz',
          status,
          totalPoints: a.evaluationPoints ?? 100,
          score: attempt?.score ?? undefined,
          submissionTypes: a.submissionTypes,
          rubric: a.rubric,
          attachmentUrl: a.assignmentDocumentUrl ?? undefined,
          strictMode: a.strictMode,
        };
      });

      return NextResponse.json({ success: true, data: formatted });
    }

    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
  } catch (error: any) {
    console.error('[assignments/route] GET Error:', error);
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      return NextResponse.json({ success: true, data: [] });
    }
    return NextResponse.json(
      { success: false, error: error.message ?? 'Failed to fetch assignments' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST  /api/assignments
// Accepts either JSON or multipart/form-data (when a document is attached).
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.TEACHER]);

    const contentType = req.headers.get('content-type') ?? '';
    let body: Record<string, any> = {};
    let documentUrl: string | undefined;

    // ── multipart/form-data ──────────────────────────────────────────────
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();

      // Extract scalar fields
      for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
          body[key] = value;
        }
      }

      // Parse JSON-stringified fields back to their original types
      for (const jsonField of ['submissionTypes', 'rubric']) {
        if (typeof body[jsonField] === 'string') {
          try {
            body[jsonField] = JSON.parse(body[jsonField]);
          } catch {
            // leave as string if parse fails
          }
        }
      }

      // Handle optional document file
      const file = formData.get('assignmentDocument') as File | null;
      if (file && file.size > 0) {
        const maxSize = 50 * 1024 * 1024; // 50 MB
        if (file.size > maxSize) {
          return NextResponse.json(
            { success: false, error: 'Document exceeds 50 MB limit' },
            { status: 400 },
          );
        }

        const timestamp = Date.now();
        const filePath = `assignments/${user.userId}/${timestamp}-${file.name}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        // Upload to 'guidelines' bucket using service role (bypasses RLS)
        documentUrl = await uploadFileToSupabase('guidelines', filePath, buffer, file.type);
        console.log('[assignments/route] Document uploaded:', documentUrl);
      }
    } else {
      // ── JSON ─────────────────────────────────────────────────────────
      body = await req.json();
    }

    const {
      courseId,
      chapterId,
      title,
      description,
      type,
      dueDate,
      submissionTypes: rawSubmissionTypes,
      rubric,
      evaluationPoints,
    } = body;

    if (!courseId || !title || !dueDate) {
      return NextResponse.json(
        { success: false, error: 'courseId, title, and dueDate are required' },
        { status: 400 },
      );
    }

    const resolvedDocumentUrl =
      documentUrl ??
      (body.assignmentDocumentUrl as string | undefined) ??
      null;

    const submissionTypes = normaliseSubmissionTypes(rawSubmissionTypes);

    const assignment = await prisma.assignment.create({
      data: {
        courseId,
        chapterId: chapterId ?? null,
        teacherId: user.userId,
        title,
        description: description ?? '',
        type: (type as 'assignment' | 'quiz') ?? 'assignment',
        dueDate: new Date(dueDate),
        submissionTypes: submissionTypes ?? undefined,
        rubric: rubric ?? undefined,
        assignmentDocumentUrl: resolvedDocumentUrl,
        evaluationPoints: evaluationPoints ? Number(evaluationPoints) : null,
        isPublished: false,
      },
      include: {
        course: { select: { id: true, name: true } },
        chapter: { select: { id: true, name: true } },
        _count: { select: { questions: true, studentAttempts: true } },
      },
    });

    console.log('[assignments/route] Assignment created:', assignment.id);

    return NextResponse.json(
      {
        success: true,
        data: {
          ...assignment,
          dueDate: assignment.dueDate.toISOString(),
          createdAt: assignment.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('[assignments/route] POST Error:', error);
    return NextResponse.json(
      { success: false, error: error.message ?? 'Failed to create assignment' },
      { status: 500 },
    );
  }
}
