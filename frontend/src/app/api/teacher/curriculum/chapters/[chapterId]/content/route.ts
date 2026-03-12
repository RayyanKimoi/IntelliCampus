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
      content: chapter.content.map((item) => {
        const isYouTube = item.fileType === 'video/youtube';
        let youtubeId = '';
        let thumbnailUrl = '';

        // Extract YouTube video ID from URL
        if (isYouTube && item.fileUrl) {
          const match = item.fileUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
          if (match) {
            youtubeId = match[1];
            thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
          }
        }

        return {
          id: item.id,
          chapterId: item.chapterId,
          uploadedBy: item.uploadedBy,
          title: item.title,
          description: item.description,
          type: isYouTube ? 'youtube' : 'pdf',
          fileUrl: item.fileUrl,
          youtubeUrl: isYouTube ? item.fileUrl : undefined,
          thumbnailUrl: thumbnailUrl || undefined,
          fileType: item.fileType,
          fileSize: item.fileSize,
          orderIndex: item.orderIndex,
          createdAt: item.createdAt.toISOString(),
          uploader: item.uploader,
        };
      }),
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

    // Get the current max order index
    const maxOrderContent = await prisma.chapterContent.findFirst({
      where: { chapterId },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    });

    const nextOrderIndex = (maxOrderContent?.orderIndex ?? -1) + 1;

    // Determine file type
    let fileType = body.fileType;
    if (!fileType) {
      // Auto-detect from URL
      if (body.fileUrl.includes('youtube.com') || body.fileUrl.includes('youtu.be')) {
        fileType = 'video/youtube';
      } else if (body.fileUrl.endsWith('.pdf')) {
        fileType = 'application/pdf';
      } else {
        fileType = 'application/octet-stream';
      }
    }

    // Create content
    const content = await prisma.chapterContent.create({
      data: {
        chapterId,
        uploadedBy: user.userId,
        title: body.title,
        description: body.description || '',
        fileUrl: body.fileUrl,
        fileType,
        fileSize: body.fileSize || 0,
        orderIndex: body.orderIndex ?? nextOrderIndex,
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

    // Format response
    const isYouTube = content.fileType === 'video/youtube';
    let youtubeId = '';
    let thumbnailUrl = '';

    if (isYouTube && content.fileUrl) {
      const match = content.fileUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      if (match) {
        youtubeId = match[1];
        thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
      }
    }

    const result = {
      id: content.id,
      chapterId: content.chapterId,
      uploadedBy: content.uploadedBy,
      title: content.title,
      description: content.description,
      type: isYouTube ? 'youtube' : 'pdf',
      fileUrl: content.fileUrl,
      youtubeUrl: isYouTube ? content.fileUrl : undefined,
      thumbnailUrl: thumbnailUrl || undefined,
      fileType: content.fileType,
      fileSize: content.fileSize,
      orderIndex: content.orderIndex,
      createdAt: content.createdAt.toISOString(),
      uploader: content.uploader,
    };

    // Trigger RAG ingestion asynchronously for PDFs — do NOT await so response returns immediately
    if (content.fileType === 'application/pdf' && content.fileUrl) {
      const courseId = chapter.courseId;
      const contentFileUrl = content.fileUrl;
      const contentTitle = content.title;
      const chapterName = chapter.name;
      const aiServiceUrl = process.env.AI_SERVICE_URL ?? 'http://localhost:5000';

      console.log(`[PDF Upload] PDF Uploaded — name: ${contentTitle}, size: ${content.fileSize} bytes, url: ${contentFileUrl}`);

      // Delegate PDF fetch + parse + embed to ai-services (pdf-parse only lives there)
      ;(async () => {
        try {
          const ingestRes = await fetch(`${aiServiceUrl}/ingest-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileUrl: contentFileUrl,
              courseId,
              topicId: chapterId,
              chapterTitle: chapterName,
            }),
          });

          const ingestData = await ingestRes.json() as { success: boolean; data?: { chunkCount: number; textLength: number }; error?: string };
          if (ingestData.success) {
            console.log(`[Ingestion] SUCCESS — ${ingestData.data?.chunkCount ?? 0} chunks upserted to Pinecone for chapter ${chapterId} (textLength: ${ingestData.data?.textLength ?? 0})`);
          } else {
            console.error(`[Ingestion] ERROR: Ingest failed — ${ingestData.error}`);
          }
        } catch (err: any) {
          console.error(`[Ingestion] WARNING: ingestion not triggered — ${err.message}`);
        }
      })();
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('[API] POST /api/teacher/curriculum/chapters/[chapterId]/content error:', error);
    
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
