import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.TEACHER]);

    const { courseId } = await context.params;

    // Mock chapters data
    const mockData: Record<string, any> = {
      'course-1': {
        courseName: 'Computer Science 101',
        chapters: [
          {
            id: 'ch-1-1',
            courseId: 'course-1',
            name: 'Introduction to Programming',
            description: 'Variables, data types, and basic syntax',
            orderIndex: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            _count: { content: 2 },
          },
          {
            id: 'ch-1-2',
            courseId: 'course-1',
            name: 'Control Flow',
            description: 'Conditionals, loops, and logical operators',
            orderIndex: 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            _count: { content: 3 },
          },
          {
            id: 'ch-1-3',
            courseId: 'course-1',
            name: 'Functions and Modules',
            description: 'Writing reusable code with functions',
            orderIndex: 3,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            _count: { content: 4 },
          },
          {
            id: 'ch-1-4',
            courseId: 'course-1',
            name: 'Object-Oriented Programming',
            description: 'Classes, objects, inheritance, and polymorphism',
            orderIndex: 4,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            _count: { content: 5 },
          },
          {
            id: 'ch-1-5',
            courseId: 'course-1',
            name: 'File I/O and Exception Handling',
            description: 'Working with files and handling errors',
            orderIndex: 5,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            _count: { content: 3 },
          },
        ],
      },
      'course-2': {
        courseName: 'Web Development Fundamentals',
        chapters: [
          {
            id: 'ch-2-1',
            courseId: 'course-2',
            name: 'HTML Basics',
            description: 'Structure of web pages with HTML5',
            orderIndex: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            _count: { content: 2 },
          },
          {
            id: 'ch-2-2',
            courseId: 'course-2',
            name: 'CSS Styling',
            description: 'Styling web pages with CSS3 and Flexbox',
            orderIndex: 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            _count: { content: 4 },
          },
          {
            id: 'ch-2-3',
            courseId: 'course-2',
            name: 'JavaScript Fundamentals',
            description: 'Client-side programming with JavaScript',
            orderIndex: 3,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            _count: { content: 5 },
          },
          {
            id: 'ch-2-4',
            courseId: 'course-2',
            name: 'React Framework',
            description: 'Building interactive UIs with React',
            orderIndex: 4,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            _count: { content: 4 },
          },
          {
            id: 'ch-2-5',
            courseId: 'course-2',
            name: 'Responsive Design',
            description: 'Building mobile-first responsive websites',
            orderIndex: 5,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            _count: { content: 3 },
          },
        ],
      },
      'course-3': {
        courseName: 'Data Structures & Algorithms',
        chapters: [
          {
            id: 'ch-3-1',
            courseId: 'course-3',
            name: 'Arrays and Linked Lists',
            description: 'Linear data structures and their operations',
            orderIndex: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            _count: { content: 3 },
          },
          {
            id: 'ch-3-2',
            courseId: 'course-3',
            name: 'Stacks and Queues',
            description: 'LIFO and FIFO data structures',
            orderIndex: 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            _count: { content: 2 },
          },
          {
            id: 'ch-3-3',
            courseId: 'course-3',
            name: 'Trees and Graphs',
            description: 'Hierarchical and network data structures',
            orderIndex: 3,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            _count: { content: 4 },
          },
          {
            id: 'ch-3-4',
            courseId: 'course-3',
            name: 'Sorting Algorithms',
            description: 'Quicksort, Mergesort, and other sorting techniques',
            orderIndex: 4,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            _count: { content: 5 },
          },
          {
            id: 'ch-3-5',
            courseId: 'course-3',
            name: 'Dynamic Programming',
            description: 'Optimization techniques and memoization',
            orderIndex: 5,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            _count: { content: 4 },
          },
        ],
      },
    };

    const result = mockData[courseId] || { courseName: 'Unknown Course', chapters: [] };
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('[API] /api/teacher/curriculum/courses/[courseId]/chapters error:', error);
    
    // Check for specific authentication/authorization errors
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
