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

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        _count: {
          select: {
            content: true,
          },
        },
        course: {
          select: {
            id: true,
            name: true,
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

    return NextResponse.json(chapter, { status: 200 });
  } catch (error: any) {
    console.error('[API] GET /api/teacher/curriculum/chapters/[chapterId] error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chapter' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ chapterId: string }> }
) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.TEACHER]);

    const { chapterId } = await context.params;
    const body = await req.json();
    const { name, description, orderIndex } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (orderIndex !== undefined) updateData.orderIndex = orderIndex;

    const updatedChapter = await prisma.chapter.update({
      where: { id: chapterId },
      data: updateData,
      include: {
        _count: {
          select: {
            content: true,
          },
        },
      },
    });

    console.log(`[API] Chapter updated: ${chapterId}`);
    return NextResponse.json(updatedChapter, { status: 200 });
  } catch (error: any) {
    console.error('[API] PUT /api/teacher/curriculum/chapters/[chapterId] error:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to update chapter' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ chapterId: string }> }
) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.TEACHER]);

    const { chapterId } = await context.params;

    await prisma.chapter.delete({
      where: { id: chapterId },
    });

    console.log(`[API] Chapter deleted: ${chapterId}`);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('[API] DELETE /api/teacher/curriculum/chapters/[chapterId] error:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to delete chapter' },
      { status: 500 }
    );
  }
}
