import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/teacher/curriculum/chapters/[chapterId]/reingest
 * Re-ingests all PDF content for a chapter into the RAG vector store.
 * Useful when a PDF was uploaded before the ingestion pipeline was working.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ chapterId: string }> }
) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.TEACHER, UserRole.ADMIN]);

    const { chapterId } = await context.params;

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        content: {
          where: { fileType: 'application/pdf' },
        },
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    const aiServiceUrl = process.env.AI_SERVICE_URL ?? 'http://localhost:5000';
    const results: { title: string; chunkCount?: number; error?: string }[] = [];

    for (const item of chapter.content) {
      try {
        if (!item.fileUrl) {
          results.push({ title: item.title, error: 'No file URL' });
          continue;
        }

        console.log(`[Reingest] Sending PDF URL to ai-services: ${item.fileUrl}`);

        // Delegate PDF fetch + parse + chunk + embed to ai-services (/ingest-url)
        const ingestRes = await fetch(`${aiServiceUrl}/ingest-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileUrl: item.fileUrl,
            courseId: chapter.courseId,
            topicId: chapterId,
            chapterTitle: chapter.name,
          }),
        });

        const ingestData = await ingestRes.json() as { success: boolean; data?: { chunkCount: number }; error?: string };

        if (!ingestRes.ok || !ingestData.success) {
          results.push({ title: item.title, error: ingestData?.error ?? 'Ingest failed' });
          continue;
        }

        const chunkCount: number = ingestData?.data?.chunkCount ?? 0;
        console.log(`[Reingest] SUCCESS — ${chunkCount} chunks upserted for "${item.title}"`);

        // Best-effort: upsert CurriculumContent record to track ingestion
        try {
          const existing = await prisma.curriculumContent.findFirst({
            where: { chapterId, fileUrl: item.fileUrl },
          });
          if (existing) {
            await prisma.curriculumContent.update({
              where: { id: existing.id },
              data: { embeddingId: `${chapterId}_${existing.id}` },
            });
          } else {
            // Look up the course creator to use as uploadedBy
            const course = await prisma.course.findUnique({
              where: { id: chapter.courseId },
              select: { createdBy: true },
            });
            const uploaderId = course?.createdBy ?? user.userId;
            await prisma.curriculumContent.create({
              data: {
                chapterId,
                uploadedBy: uploaderId,
                title: item.title,
                contentText: '',
                fileUrl: item.fileUrl,
                embeddingId: `${chapterId}_${item.id}`,
              },
            });
          }
        } catch (dbErr: any) {
          console.warn('[Reingest] DB tracking failed (non-fatal):', dbErr.message);
        }

        results.push({ title: item.title, chunkCount });
      } catch (err: any) {
        results.push({ title: item.title, error: err.message });
      }
    }

    const total = results.reduce((acc, r) => acc + (r.chunkCount ?? 0), 0);
    return NextResponse.json({ success: true, results, totalChunks: total });
  } catch (error: any) {
    const isAuthError = error.message?.includes('Authentication required') || error.message?.includes('Invalid or expired token');
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: isAuthError ? 401 : 500 }
    );
  }
}
