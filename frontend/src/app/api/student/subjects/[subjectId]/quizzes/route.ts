import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { supabaseAdmin } from '@/lib/supabase-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/student/subjects/[subjectId]/quizzes
 * Fetch quizzes for a specific subject (chapter)
 * Uses Supabase Admin client to bypass RLS
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);
    
    const { subjectId } = await params;

    // Fetch quizzes using Supabase Admin
    const { data: assignments, error } = await supabaseAdmin
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
        courses (
          id,
          name
        ),
        chapters (
          id,
          name
        ),
        student_attempts (
          id,
          student_id,
          score,
          submitted_at,
          graded_at
        )
      `)
      .eq('type', 'quiz')
      .eq('is_published', true)
      .or(`chapter_id.eq.${subjectId},course_id.eq.${subjectId}`)
      .order('due_date', { ascending: true });

    if (error) {
      console.error('[Student Subject Quizzes API] Error:', error);
      return NextResponse.json({ success: true, data: [] });
    }

    // Format the response
    const formattedQuizzes = (assignments || []).map((assignment: any) => {
      const userAttempts = assignment.student_attempts?.filter((a: any) => a.student_id === user.userId) || [];
      const latestAttempt = userAttempts[0];
      const isPastDue = new Date(assignment.due_date) < new Date();

      let status: 'pending' | 'submitted' | 'graded' | 'late' = 'pending';
      if (latestAttempt) {
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
    console.error('[Student Subject Quizzes API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch quizzes' },
      { status: 500 }
    );
  }
}
