import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { userService } from '@/services/user.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    const body = await req.json();
    
    const profile = await userService.updateProfile(user.userId, body);
    return NextResponse.json(
      { success: true, data: profile, message: 'Profile updated' },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message.includes('Authentication') ? 401 : 400 }
    );
  }
}
