import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import JSZip from 'jszip';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/reports/download
 * Downloads a specific report in requested format
 */
export async function POST(req: NextRequest) {
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

    const { reportId, format, data } = await req.json();

    if (!reportId || !format) {
      return NextResponse.json(
        { error: 'Report ID and format are required' },
        { status: 400 }
      );
    }

    // Generate report based on format
    if (format === 'CSV' || format === 'XLSX') {
      return await exportCSV(reportId, data);
    } else if (format === 'ZIP') {
      return await exportZIP(reportId, data);
    } else if (format === 'PDF') {
      // For now, return JSON (PDF generation would require additional library)
      return NextResponse.json({
        message: 'PDF generation not yet implemented',
        data
      });
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });

  } catch (error: any) {
    console.error('Error downloading report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to download report' },
      { status: 500 }
    );
  }
}

async function exportCSV(reportId: string, data: any) {
  let csv = '';

  switch (reportId) {
    case 'institutional-performance':
      csv = generatePerformanceCSV(data);
      break;
    case 'student-progress':
      csv = generateStudentProgressCSV(data);
      break;
    case 'assessment-audit':
      csv = generateAssessmentAuditCSV(data);
      break;
    case 'ai-usage':
      csv = generateAIUsageCSV(data);
      break;
    case 'completion-dropout':
      csv = generateCompletionDropoutCSV(data);
      break;
    case 'accessibility':
      csv = generateAccessibilityCSV(data);
      break;
    default:
      csv = 'Report,Data\n"No data available",""';
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${reportId}_${new Date().toISOString().split('T')[0]}.csv"`
    }
  });
}

async function exportZIP(reportId: string, data: any) {
  const zip = new JSZip();

  if (reportId === 'accreditation-pack') {
    // Create comprehensive evidence pack
    zip.file('institutional_performance.csv', generatePerformanceCSV(data.performance));
    zip.file('student_progress_summary.txt', `Total Students: ${data.studentProgress?.total || 0}\n${data.studentProgress?.summary || ''}`);
    zip.file('assessment_audit_summary.txt', `Total Submissions: ${data.assessmentAudit?.total || 0}\n${data.assessmentAudit?.summary || ''}`);
    zip.file('ai_usage_report.csv', generateAIUsageCSV(data.aiUsage));
    zip.file('accessibility_report.csv', generateAccessibilityCSV(data.accessibility));
    zip.file('README.txt', generateReadme(reportId));
  } else {
    // Single report in ZIP
    const csv = await exportCSV(reportId, data);
    const csvContent = await csv.text();
    zip.file(`${reportId}.csv`, csvContent);
    zip.file('README.txt', generateReadme(reportId));
  }

  const summary = {
    reportId,
    generatedAt: new Date().toISOString(),
    institution: 'IntelliCampus',
    dataScope: 'institution-wide'
  };
  zip.file('metadata.json', JSON.stringify(summary, null, 2));

  const zipBuffer = await zip.generateAsync({ type: 'uint8array' });
  const buffer = Buffer.from(zipBuffer);

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${reportId}_${new Date().toISOString().split('T')[0]}.zip"`
    }
  });
}

// CSV Generation Functions

function generatePerformanceCSV(data: any): string {
  const headers = [
    'Metric',
    'Value'
  ];

  const rows = [
    ['Total Courses', data.totalCourses],
    ['Total Students', data.totalStudents],
    ['Total Assignments', data.totalAssignments],
    ['Total Submissions', data.totalSubmissions],
    ['Late Submissions', data.lateSubmissions],
    ['Integrity Flags', data.integrityFlags],
    ['Average Score (%)', data.averageScore],
    ['Completion Rate (%)', data.completionRate],
  ];

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

function generateStudentProgressCSV(data: any): string {
  if (!data.students || data.students.length === 0) {
    return 'Student Name,Email,Enrolled Courses,Total Attempts,Submitted,Average Score,Last Activity\n';
  }

  const headers = [
    'Student Name',
    'Email',
    'Enrolled Courses',
    'Total Attempts',
    'Submitted',
    'Average Score',
    'Last Activity'
  ];

  const rows = data.students.map((s: any) => [
    escapeCsvValue(s.studentName),
    escapeCsvValue(s.email),
    s.enrolledCourses,
    s.totalAttempts,
    s.submittedAttempts,
    s.averageScore,
    s.lastActivity || 'Never'
  ]);

  return [headers.join(','), ...rows.map((row: any) => row.join(','))].join('\n');
}

function generateAssessmentAuditCSV(data: any): string {
  if (!data.attempts || data.attempts.length === 0) {
    return 'Assignment ID,Student ID,Score,Rubric Scores,Teacher Comment,Submitted At,Graded At,Integrity Flag\n';
  }

  const headers = [
    'Assignment ID',
    'Assignment Title',
    'Course',
    'Student ID',
    'Student Name',
    'Score',
    'Submitted At',
    'Graded At',
    'Graded By',
    'Integrity Flag'
  ];

  const rows = data.attempts.map((a: any) => [
    escapeCsvValue(a.assignmentId),
    escapeCsvValue(a.assignmentTitle),
    escapeCsvValue(a.courseName),
    escapeCsvValue(a.studentId),
    escapeCsvValue(a.studentName),
    a.score,
    a.submittedAt || 'N/A',
    a.gradedAt || 'N/A',
    escapeCsvValue(a.gradedBy || ''),
    a.integrityFlag ? 'Yes' : 'No'
  ]);

  return [headers.join(','), ...rows.map((row: any) => row.join(','))].join('\n');
}

function generateAIUsageCSV(data: any): string {
  const headers = ['Metric', 'Value'];
  
  const rows = [
    ['Total Sessions', data.totalSessions],
    ['Unique Students', data.uniqueStudents],
  ];

  if (data.sessionsByMode) {
    data.sessionsByMode.forEach((mode: any) => {
      rows.push([`Sessions (${mode.mode})`, mode.count]);
    });
  }

  return [headers.join(','), ...rows.map((row: any) => row.join(','))].join('\n');
}

function generateCompletionDropoutCSV(data: any): string {
  if (!data.analysis || data.analysis.length === 0) {
    return 'Student Name,Email,Completion Rate,Risk Level\n';
  }

  const headers = [
    'Student Name',
    'Email',
    'Enrolled Courses',
    'Completed Assignments',
    'Total Assignments',
    'Completion Rate (%)',
    'Risk Level'
  ];

  const rows = data.analysis.map((s: any) => [
    escapeCsvValue(s.studentName),
    escapeCsvValue(s.email),
    s.enrolledCourses,
    s.completedAssignments,
    s.totalAssignments,
    s.completionRate,
    s.riskLevel
  ]);

  return [headers.join(','), ...rows.map((row: any) => row.join(','))].join('\n');
}

function generateAccessibilityCSV(data: any): string {
  const headers = ['Metric', 'Value'];
  
  const rows = [
    ['Total Users', data.totalUsers],
    ['Users with Settings', data.usersWithAccessibilitySettings],
    ['Adoption Rate (%)', data.adoptionRate],
  ];

  if (data.featureUsage) {
    Object.entries(data.featureUsage).forEach(([feature, count]) => {
      rows.push([feature, count]);
    });
  }

  return [headers.join(','), ...rows.map((row: any) => row.join(','))].join('\n');
}

function generateReadme(reportId: string): string {
  return `IntelliCampus Admin Report
===========================

Report: ${reportId}
Generated: ${new Date().toLocaleString()}
Scope: Institution-wide

This report contains comprehensive data for administrative oversight,
accreditation preparation, and institutional analysis.

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
