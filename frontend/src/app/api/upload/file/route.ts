import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { uploadToSupabase } from '@/lib/supabase-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/upload/file
 * Handles file uploads and saves them to the public/uploads directory
 * Returns the file URL that can be used to access the file
 */
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.TEACHER, UserRole.ADMIN]);

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PDF, DOC, DOCX, PPT, PPTX, images' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${timestamp}_${sanitizedFileName}`;
    const filePath = `curriculum/${user.institutionId}/${fileName}`;

    // Convert file to buffer and upload to Supabase
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    let fileUrl: string;
    try {
      fileUrl = await uploadToSupabase('course-materials', filePath, buffer, file.type);
    } catch (uploadError: any) {
      console.error('[API] Supabase upload failed:', uploadError);
      return NextResponse.json(
        { error: `File upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    console.log(`[PDF Upload] PDF Uploaded — name: ${file.name}, size: ${file.size} bytes, type: ${file.type}, url: ${fileUrl}`);

    return NextResponse.json(
      {
        success: true,
        fileUrl,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[API] POST /api/upload/file error:', error);

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
