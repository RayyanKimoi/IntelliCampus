import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { supabaseAdmin } from '@/lib/supabase-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/student/quizzes?courseId=
 * Fetch published quizzes (type='quiz') for enrolled courses.
 * Optional ?courseId= narrows to a single course.
 * Uses Supabase Admin to bypass RLS.
 */
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);

    const courseId = req.nextUrl.searchParams.get('courseId') ?? undefined;

    // Get enrolled course IDs
    const { data: enrollments, error: enrollError } = await supabaseAdmin
      .from('course_enrollments')
      .select('course_id')
      .eq('student_id', user.userId);

    if (enrollError) {
      console.error('[Student Quizzes API] Enrollment fetch error:', enrollError);
      return NextResponse.json({ success: true, data: [] });
    }

    const enrolledCourseIds = enrollments?.map((e) => e.course_id) || [];
    if (enrolledCourseIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // If a courseId filter is requested, verify enrollment
    if (courseId && !enrolledCourseIds.includes(courseId)) {
      return NextResponse.json({ success: false, error: 'Not enrolled in this course' }, { status: 403 });
    }

    const applicableCourseIds = courseId ? [courseId] : enrolledCourseIds;

    // Fetch quizzes via Supabase Admin (bypasses RLS)
    const { data: assignments, error: assignError } = await supabaseAdmin
      .from('assignments')
      .select(`
        id,
        course_id,
        chapter_id,
        teacher_id,
        title,
        description,
        type,
        due_date,
        is_published,
        evaluation_points,
        created_at,
        courses ( id, name ),
        chapters ( id, name )
      `)
      .eq('type', 'quiz')
      .eq('is_published', true)
      .in('course_id', applicableCourseIds)
      .order('due_date', { ascending: true });

    if (assignError) {
      console.error('[Student Quizzes API] Assignment fetch error:', assignError);
      return NextResponse.json({ success: true, data: [] });
    }

    // Fetch this student's quiz attempts separately to avoid inner-join exclusion
    const { data: allAttempts } = await supabaseAdmin
      .from('student_attempts')
      .select('id, assignment_id, student_id, score, submitted_at, graded_at')
      .eq('student_id', user.userId);

    const attemptsByQuizId = new Map<string, any>();
    for (const attempt of allAttempts ?? []) {
      if (!attemptsByQuizId.has(attempt.assignment_id)) {
        attemptsByQuizId.set(attempt.assignment_id, attempt);
      }
    }

    // Format the response
    const formattedQuizzes = (assignments || []).map((assignment: any) => {
      const latestAttempt = attemptsByQuizId.get(assignment.id) ?? null;
      const isPastDue = new Date(assignment.due_date) < new Date();
      let status: 'pending' | 'submitted' | 'graded' | 'late' = 'pending';
      if (latestAttempt?.submitted_at) {
        status = latestAttempt.graded_at ? 'graded' : 'submitted';
      } else if (isPastDue) {
        status = 'late';
      }
      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        type: assignment.type as 'quiz',
        dueDate: assignment.due_date,
        courseId: assignment.course_id,
        subjectId: assignment.chapter_id || assignment.course_id,
        courseName: assignment.courses?.name || 'Unknown Course',
        subjectName: assignment.chapters?.name || assignment.courses?.name || 'Unknown Subject',
        status,
        totalPoints: assignment.evaluation_points || 100,
        score: latestAttempt?.score,
      };
    });

    return NextResponse.json({ success: true, data: formattedQuizzes });
  } catch (error: any) {
    console.error('[Student Quizzes API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch quizzes' },
      { status: 500 },
    );
  }
}
