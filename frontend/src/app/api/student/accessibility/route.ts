import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Dev mode flag
const isDevelopment = true;

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    // In dev mode, allow all roles to access accessibility settings
    if (!isDevelopment) {
      requireRole(user, ['student']);
    }

    // Return default accessibility settings
    const settings = {
      id: `accessibility-${user.userId}`,
      userId: user.userId,
      focusMode: false,
      textSize: 'medium',
      highContrast: false,
      reducedMotion: false,
      screenReader: false,
      dyslexiaFont: false,
      keyboardNav: false,
    };

    return NextResponse.json(settings, { status: 200 });
  } catch (error: any) {
    console.error('[API] /api/student/accessibility error:', error);
    
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

export async function PUT(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    // In dev mode, allow all roles to update accessibility settings
    if (!isDevelopment) {
      requireRole(user, ['student']);
    }

    const body = await req.json();

    // Mock update - just return the updated settings
    const settings = {
      id: `accessibility-${user.userId}`,
      userId: user.userId,
      ...body,
    };

    return NextResponse.json(settings, { status: 200 });
  } catch (error: any) {
    console.error('[API] /api/student/accessibility PUT error:', error);
    
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
