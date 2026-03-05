import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = getAuthUser(req);
    requireRole(user, ['student']);

    const subjects = await prisma.subject.findMany({
      where: { courseId: params.courseId },
      include: {
        topics: { orderBy: { orderIndex: 'asc' } },
      },
    });
    return NextResponse.json({ success: true, data: subjects }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      {
        status: error.message.includes('Authentication') ? 401
          : error.message.includes('permissions') ? 403
          : 500,
      }
    );
  }
}
