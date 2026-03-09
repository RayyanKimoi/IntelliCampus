import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/reports/export-csv
 * Exports report data as CSV
 */
export async function POST(req: NextRequest) {
  try {
    // Authentication
    let user;
    try {
      user = getAuthUser(req);
      requireRole(user, [UserRole.TEACHER]);
    } catch (authError: any) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: authError.message || 'Authentication failed' },
        { status: 401 }
      );
    }

    const { data, reportType } = await req.json();

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    let csv = '';

    // Generate CSV based on report type
    if (reportType === 'performance') {
      csv = generatePerformanceCSV(data);
    } else if (reportType === 'assignment') {
      csv = generateAssignmentCSV(data);
    } else if (reportType === 'weak_students') {
      csv = generateWeakStudentsCSV(data);
    } else if (reportType === 'integrity') {
      csv = generateIntegrityCSV(data);
    } else if (reportType === 'coverage') {
      csv = generateCoverageCSV(data);
    } else {
      csv = generatePerformanceCSV(data);
    }

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="report_${reportType}_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error: any) {
    console.error('Error exporting CSV:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { error: error.message || 'Failed to export CSV' },
      { status: 500 }
    );
  }
}

function generatePerformanceCSV(data: any[]): string {
  const headers = [
    'Student Name',
    'Email',
    'Roll Number',
    'Course',
    'Chapter',
    'Assignment',
    'Type',
    'Score',
    'Total Points',
    'Percentage',
    'Status',
    'Submitted At',
    'Graded At',
    'Graded By',
    'Teacher Comment',
    'Integrity Flag'
  ];

  const rows = data.map(row => [
    escapeCsvValue(row.studentName),
    escapeCsvValue(row.studentEmail),
    escapeCsvValue(row.rollNumber),
    escapeCsvValue(row.courseName),
    escapeCsvValue(row.chapterName),
    escapeCsvValue(row.assignmentTitle),
    escapeCsvValue(row.assignmentType),
    row.score,
    row.totalPoints,
    row.percentage,
    escapeCsvValue(row.status),
    row.submittedAt || 'Not Submitted',
    row.gradedAt || 'Not Graded',
    escapeCsvValue(row.gradedBy || ''),
    escapeCsvValue(row.teacherComment),
    row.integrityFlag ? 'Yes' : 'No'
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

function generateAssignmentCSV(data: any[]): string {
  const headers = [
    'Assignment Title',
    'Type',
    'Course',
    'Due Date',
    'Total Questions',
    'Total Attempts',
    'Submitted',
    'Late',
    'Missing',
    'Average Score',
    'Highest Score',
    'Lowest Score'
  ];

  const rows = data.map(row => [
    escapeCsvValue(row.assignmentTitle),
    escapeCsvValue(row.assignmentType),
    escapeCsvValue(row.courseName),
    row.dueDate,
    row.totalQuestions,
    row.attempts,
    row.submitted,
    row.late,
    row.missing,
    row.averageScore,
    row.highestScore,
    row.lowestScore
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

function generateWeakStudentsCSV(data: any[]): string {
  const headers = [
    'Student Name',
    'Email',
    'Average Score',
    'Total Assignments',
    'Lowest Score',
    'Highest Score',
    'Risk Level'
  ];

  const rows = data.map(row => [
    escapeCsvValue(row.studentName),
    escapeCsvValue(row.studentEmail),
    row.averageScore,
    row.totalAssignments,
    row.lowestScore,
    row.highestScore,
    escapeCsvValue(row.riskLevel)
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

function generateIntegrityCSV(data: any[]): string {
  const headers = [
    'Student Name',
    'Email',
    'Assignment Title',
    'Type',
    'Course',
    'Chapter',
    'Score',
    'Submitted At',
    'Integrity Flag',
    'Teacher Comment'
  ];

  const rows = data.map(row => [
    escapeCsvValue(row.studentName),
    escapeCsvValue(row.studentEmail),
    escapeCsvValue(row.assignmentTitle),
    escapeCsvValue(row.assignmentType),
    escapeCsvValue(row.courseName),
    escapeCsvValue(row.chapterName),
    row.score,
    row.submittedAt || 'Not Submitted',
    row.integrityFlag ? 'Yes' : 'No',
    escapeCsvValue(row.teacherComment)
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

function generateCoverageCSV(data: any[]): string {
  const headers = [
    'Course',
    'Chapter',
    'Total Assignments',
    'Total Attempts',
    'Enrolled Students',
    'Coverage Percentage'
  ];

  const rows = data.map(row => [
    escapeCsvValue(row.courseName),
    escapeCsvValue(row.chapterName),
    row.totalAssignments,
    row.totalAttempts,
    row.enrolledStudents,
    row.coveragePercentage
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

function escapeCsvValue(value: any): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}
