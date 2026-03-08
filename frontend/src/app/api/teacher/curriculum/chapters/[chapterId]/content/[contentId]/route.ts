import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ chapterId: string; contentId: string }> }
) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.TEACHER]);

    const { contentId } = await context.params;
    const body = await req.json();
    const { title, description, fileUrl, fileType, fileSize, orderIndex } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl;
    if (fileType !== undefined) updateData.fileType = fileType;
    if (fileSize !== undefined) updateData.fileSize = fileSize;
    if (orderIndex !== undefined) updateData.orderIndex = orderIndex;

    const updatedContent = await prisma.chapterContent.update({
      where: { id: contentId },
      data: updateData,
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

    console.log(`[API] Content updated: ${contentId}`);
    return NextResponse.json(updatedContent, { status: 200 });
  } catch (error: any) {
    console.error('[API] PUT content error:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to update content' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ chapterId: string; contentId: string }> }
) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.TEACHER]);

    const { contentId } = await context.params;

    await prisma.chapterContent.delete({
      where: { id: contentId },
    });

    console.log(`[API] Content deleted: ${contentId}`);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('[API] DELETE content error:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to delete content' },
      { status: 500 }
    );
  }
}
