import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, ['admin']);
    
    // Get dashboard stats
    const [totalUsers, totalCourses, aiUsageData] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.aISession.count()
    ]);

    const students = await prisma.user.count({ where: { role: 'student' } });
    const teachers = await prisma.user.count({ where: { role: 'teacher' } });

    const stats = {
      totalUsers,
      totalStudents: students,
      totalTeachers: teachers,
      totalCourses,
      aiUsage: {
        totalRequests: aiUsageData,
        tokensUsed: aiUsageData * 500 // Estimate
      },
      systemHealth: {
        database: 'healthy',
        aiService: 'healthy'
      }
    };

    return NextResponse.json(
      { success: true, data: stats },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message.includes('Authentication') ? 401 : error.message.includes('permissions') ? 403 : 400 }
    );
  }
}
