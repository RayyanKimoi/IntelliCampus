import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);

    const { courseId } = await context.params;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          include: {
            content: {
              orderBy: { orderIndex: 'asc' },
              select: {
                id: true,
                title: true,
                description: true,
                fileUrl: true,
                fileType: true,
                fileSize: true,
                orderIndex: true,
                createdAt: true,
              },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        courseName: course.name,
        chapters: course.chapters.map((ch) => ({
          id: ch.id,
          name: ch.name,
          description: ch.description,
          orderIndex: ch.orderIndex,
          content: ch.content.map((item) => {
            const isYouTube = item.fileType === 'video/youtube';
            let youtubeId = '';
            let thumbnailUrl = '';
            if (isYouTube && item.fileUrl) {
              const match = item.fileUrl.match(
                /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
              );
              if (match) {
                youtubeId = match[1];
                thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
              }
            }
            return {
              id: item.id,
              title: item.title,
              description: item.description,
              type: isYouTube ? 'youtube' : 'pdf',
              fileUrl: item.fileUrl,
              youtubeId: youtubeId || undefined,
              thumbnailUrl: thumbnailUrl || undefined,
              fileSize: item.fileSize,
              orderIndex: item.orderIndex,
              createdAt: item.createdAt.toISOString(),
            };
          }),
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    const isAuthError =
      error.message?.includes('Authentication required') ||
      error.message?.includes('Invalid or expired token');
    const isPermissionError = error.message?.includes('Insufficient permissions');
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: isAuthError ? 401 : isPermissionError ? 403 : 500 }
    );
  }
}
