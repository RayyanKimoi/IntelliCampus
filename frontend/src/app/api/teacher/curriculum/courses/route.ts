import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, ['teacher']);
    console.log('[API] Teacher courses requested by:', user.email);

    // Mock course data since database is unavailable
    const mockCourses = [
      {
        id: 'course-1',
        name: 'Computer Science 101',
        description: 'Introduction to Computer Science and Programming',
        institutionId: 'inst-1',
        createdBy: user.userId,
        createdAt: new Date().toISOString(),
        _count: { chapters: 5, assignments: 5 },
      },
      {
        id: 'course-2',
        name: 'Web Development Fundamentals',
        description: 'Learn HTML, CSS, JavaScript, and modern web frameworks',
        institutionId: 'inst-1',
        createdBy: user.userId,
        createdAt: new Date().toISOString(),
        _count: { chapters: 5, assignments: 8 },
      },
      {
        id: 'course-3',
        name: 'Data Structures & Algorithms',
        description: 'Advanced data structures and algorithmic problem solving',
        institutionId: 'inst-1',
        createdBy: user.userId,
        createdAt: new Date().toISOString(),
        _count: { chapters: 5, assignments: 6 },
      },
    ];

    return NextResponse.json(mockCourses, { status: 200 });
  } catch (error: any) {
    console.error('[API] /api/teacher/curriculum/courses error:', error);
    
    const isAuthError = error.message?.includes('Authentication required') || 
                        error.message?.includes('Invalid or expired token');
    const isPermissionError = error.message?.includes('Insufficient permissions');
    
    const statusCode = isAuthError ? 401 : isPermissionError ? 403 : 500;
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: statusCode }
    );
  }
}
