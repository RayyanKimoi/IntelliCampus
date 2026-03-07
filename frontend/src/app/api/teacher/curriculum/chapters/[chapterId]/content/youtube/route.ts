import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
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
    const { title, youtubeUrl } = body;

    if (!title || !youtubeUrl) {
      return NextResponse.json(
        { error: 'Title and youtubeUrl are required' },
        { status: 400 }
      );
    }

    const videoId = extractYouTubeVideoId(youtubeUrl);
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL. Please provide a valid YouTube link.' },
        { status: 400 }
      );
    }

    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    const newContent = {
      id: `content-yt-${Date.now()}`,
      chapterId,
      uploadedBy: user.userId,
      title,
      description: '',
      type: 'youtube',
      fileUrl: '',
      youtubeUrl,
      thumbnailUrl,
      teacherNotes: null,
      fileType: 'youtube',
      fileSize: 0,
      orderIndex: 0,
      createdAt: new Date().toISOString(),
      uploader: { id: user.userId, email: user.email },
    };

    return NextResponse.json({ success: true, data: newContent }, { status: 201 });
  } catch (error: any) {
    console.error('[API] POST youtube content error:', error);

    const isAuthError =
      error.message?.includes('Authentication required') ||
      error.message?.includes('Invalid or expired token');
    const statusCode = isAuthError ? 401 : 500;

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: statusCode }
    );
  }
}
