import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { curriculumService } from '@/services/curriculum.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);

    const course = await curriculumService.getCourseById(courseId);
    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: course }, { status: 200 });
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
