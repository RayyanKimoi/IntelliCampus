import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, ['admin']);
    
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          institutionId: true,
          createdAt: true,
        }
      }),
      prisma.user.count()
    ]);

    const usersWithStatus = users.map(u => ({
      ...u,
      status: 'active',
      createdAt: u.createdAt.toISOString()
    }));

    return NextResponse.json(
      { success: true, data: { users: usersWithStatus, total } },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message.includes('Authentication') ? 401 : error.message.includes('permissions') ? 403 : 400 }
    );
  }
}
