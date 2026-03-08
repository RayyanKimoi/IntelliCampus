import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ chapterId: string }> }
) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.TEACHER]);

    const { chapterId } = await context.params;

    // Get chapter with content from database
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        content: {
          include: {
            uploader: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    const result = {
      chapterName: chapter.name,
      content: chapter.content.map((item) => ({
        id: item.id,
        chapterId: item.chapterId,
        uploadedBy: item.uploadedBy,
        title: item.title,
        description: item.description,
        fileUrl: item.fileUrl,
        fileType: item.fileType,
        fileSize: item.fileSize,
        orderIndex: item.orderIndex,
        createdAt: item.createdAt.toISOString(),
        uploader: item.uploader,
      })),
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('[API] /api/teacher/curriculum/chapters/[chapterId]/content error:', error);
    
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

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ chapterId: string }> }
) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.TEACHER]);

    const { chapterId } = await context.params;
    const body = await req.json();
    const { title, description, fileUrl, fileType, fileSize } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Content title is required' },
        { status: 400 }
      );
    }

    // Verify chapter exists
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // Get the highest order index if not provided
    const lastContent = await prisma.chapterContent.findFirst({
      where: { chapterId },
      orderBy: { orderIndex: 'desc' },
    });
    const finalOrderIndex = (lastContent?.orderIndex || 0) + 1;

    // Create content
    const newContent = await prisma.chapterContent.create({
      data: {
        chapterId,
        uploadedBy: user.userId,
        title,
        description: description || '',
        fileUrl: fileUrl || '',
        fileType: fileType || 'application/pdf',
        fileSize: fileSize || 0,
        orderIndex: finalOrderIndex,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log(`[API] Content created: ${newContent.id} for chapter ${chapterId}`);
    return NextResponse.json({ success: true, data: newContent }, { status: 201 });
  } catch (error: any) {
    console.error('[API] POST /api/teacher/curriculum/chapters/[chapterId]/content error:', error);
    
    const isAuthError = error.message?.includes('Authentication required') || 
                        error.message?.includes('Invalid or expired token');
    const statusCode = isAuthError ? 401 : 500;
    
    return NextResponse.json(
      { error: error.message || 'Failed to create content' },
      { status: 500 }
    );
  }
}
