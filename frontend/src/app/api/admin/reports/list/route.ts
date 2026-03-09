import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/reports/list
 * Fetches list of available reports with metadata
 */
export async function GET(req: NextRequest) {
  try {
    // Authentication
    let user;
    try {
      user = getAuthUser(req);
      requireRole(user, [UserRole.ADMIN]);
    } catch (authError: any) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: authError.message || 'Authentication failed' },
        { status: 401 }
      );
    }

    // Get institution-level statistics
    const [
      totalCourses,
      totalStudents,
      totalTeachers,
      totalAssignments,
      totalSubmissions,
      aiSessions,
    ] = await Promise.all([
      prisma.course.count(),
      prisma.user.count({ where: { role: UserRole.STUDENT } }),
      prisma.user.count({ where: { role: UserRole.TEACHER } }),
      prisma.assignment.count(),
      prisma.studentAttempt.count({ where: { submittedAt: { not: null } } }),
      prisma.aISession.count(),
    ]);

    // Calculate average score
    const attempts = await prisma.studentAttempt.findMany({
      where: { submittedAt: { not: null } },
      select: { score: true, assignmentId: true }
    });

    let averageScore = 0;
    if (attempts.length > 0) {
      // Get total points for each assignment
      const assignmentIds = [...new Set(attempts.map(a => a.assignmentId))];
      const assignmentPoints = new Map<string, number>();
      
      for (const id of assignmentIds) {
        const questionCount = await prisma.question.count({ where: { assignmentId: id } });
        assignmentPoints.set(id, questionCount || 100);
      }

      const percentages = attempts.map(a => 
        (a.score / (assignmentPoints.get(a.assignmentId) || 100)) * 100
      );
      averageScore = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
    }

    const stats = {
      totalCourses,
      totalStudents,
      totalTeachers,
      totalAssignments,
      totalSubmissions,
      averageScore: averageScore.toFixed(2),
      aiSessions,
    };

    // Define report templates
    const reports = [
      {
        id: 'institutional-performance',
        title: 'Institutional Performance Summary',
        description: 'Overall pass rates, engagement and AI usage across all courses.',
        category: 'Performance',
        status: 'ready',
        format: 'PDF',
        lastGenerated: new Date().toISOString().split('T')[0],
      },
      {
        id: 'student-progress',
        title: 'Student Progress Export',
        description: 'Individual student mastery, scores, and activity timeline.',
        category: 'Student Data',
        status: 'ready',
        format: 'XLSX',
        lastGenerated: new Date().toISOString().split('T')[0],
      },
      {
        id: 'assessment-audit',
        title: 'Assessment Results Audit',
        description: 'All assessment submissions, scores and integrity flags.',
        category: 'Governance',
        status: 'ready',
        format: 'CSV',
        lastGenerated: new Date().toISOString().split('T')[0],
      },
      {
        id: 'ai-usage',
        title: 'AI Usage & Token Report',
        description: 'AI session logs, token consumption and mode distribution.',
        category: 'AI Analytics',
        status: 'ready',
        format: 'PDF',
        lastGenerated: new Date().toISOString().split('T')[0],
      },
      {
        id: 'completion-dropout',
        title: 'Completion & Dropout Analysis',
        description: 'Course completion rates and at-risk student identification.',
        category: 'Retention',
        status: 'ready',
        format: 'PDF',
        lastGenerated: new Date().toISOString().split('T')[0],
      },
      {
        id: 'accessibility',
        title: 'Accessibility Compliance Report',
        description: 'Accessibility feature usage and WCAG compliance summary.',
        category: 'Inclusion',
        status: 'ready',
        format: 'PDF',
        lastGenerated: new Date().toISOString().split('T')[0],
      },
      {
        id: 'accreditation-pack',
        title: 'Accreditation Evidence Pack',
        description: 'Full evidence bundle for accreditation body submission.',
        category: 'Accreditation',
        status: 'ready',
        format: 'ZIP',
        lastGenerated: new Date().toISOString().split('T')[0],
      },
    ];

    return NextResponse.json({
      reports,
      stats,
    });

  } catch (error: any) {
    console.error('Error fetching admin reports:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
