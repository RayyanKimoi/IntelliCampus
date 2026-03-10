import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import JSZip from 'jszip';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/reports/export-zip
 * Exports report data as ZIP (CSV + JSON summary)
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

    const { data, summary, reportType } = await req.json();

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Create ZIP file
    const zip = new JSZip();

    // Add CSV file
    const csv = generateCSV(data, reportType);
    zip.file(`report_${reportType}.csv`, csv);

    // Add summary JSON
    const summaryJson = JSON.stringify({
      reportType,
      generatedAt: new Date().toISOString(),
      filters: {},
      summary: summary || {},
      totalRecords: data.length
    }, null, 2);
    zip.file('summary.json', summaryJson);

    // Add README
    const readme = generateReadme(reportType);
    zip.file('README.txt', readme);

    // Generate ZIP
    const zipBuffer = await zip.generateAsync({ type: 'uint8array' });
    const buffer = Buffer.from(zipBuffer);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="report_${reportType}_${new Date().toISOString().split('T')[0]}.zip"`
      }
    });

  } catch (error: any) {
    console.error('Error exporting ZIP:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { error: error.message || 'Failed to export ZIP' },
      { status: 500 }
    );
  }
}

function generateCSV(data: any[], reportType: string): string {
  let csv = '';

  if (reportType === 'performance') {
    const headers = [
      'Student Name', 'Email', 'Roll Number', 'Course', 'Chapter', 'Assignment',
      'Type', 'Score', 'Total Points', 'Percentage', 'Status', 'Submitted At',
      'Graded At', 'Graded By', 'Teacher Comment', 'Integrity Flag'
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

    csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  } else if (reportType === 'assignment') {
    const headers = [
      'Assignment Title', 'Type', 'Course', 'Due Date', 'Total Questions',
      'Total Attempts', 'Submitted', 'Late', 'Missing', 'Average Score',
      'Highest Score', 'Lowest Score'
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

    csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  } else if (reportType === 'weak_students') {
    const headers = [
      'Student Name', 'Email', 'Average Score', 'Total Assignments',
      'Lowest Score', 'Highest Score', 'Risk Level'
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

    csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  } else if (reportType === 'integrity') {
    const headers = [
      'Student Name', 'Email', 'Assignment Title', 'Type', 'Course',
      'Chapter', 'Score', 'Submitted At', 'Integrity Flag', 'Teacher Comment'
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

    csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  } else if (reportType === 'coverage') {
    const headers = [
      'Course', 'Chapter', 'Total Assignments', 'Total Attempts',
      'Enrolled Students', 'Coverage Percentage'
    ];

    const rows = data.map(row => [
      escapeCsvValue(row.courseName),
      escapeCsvValue(row.chapterName),
      row.totalAssignments,
      row.totalAttempts,
      row.enrolledStudents,
      row.coveragePercentage
    ]);

    csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  return csv;
}

function generateReadme(reportType: string): string {
  return `IntelliCampus Report Export
============================

Report Type: ${reportType}
Generated: ${new Date().toLocaleString()}

Contents:
---------
- report_${reportType}.csv: Main report data in CSV format
- summary.json: Report summary and metadata
- README.txt: This file

Usage:
------
1. Open report_${reportType}.csv in Excel or any spreadsheet application
2. Review summary.json for aggregate statistics
3. Use the data for further analysis or record-keeping

For questions or support, contact your system administrator.

© IntelliCampus ${new Date().getFullYear()}
`;
}

function escapeCsvValue(value: any): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}
