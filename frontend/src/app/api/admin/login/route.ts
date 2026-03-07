import { NextRequest, NextResponse } from 'next/server';
import { adminOTPService } from '@/services/admin-otp.service';
import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Validate credentials
    if (
      email?.toLowerCase() !== env.ADMIN_EMAIL.toLowerCase() ||
      password !== env.ADMIN_PASSWORD
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid admin credentials' },
        { status: 401 }
      );
    }

    // Generate and send OTP
    const result = await adminOTPService.generateAndSendOTP(env.ADMIN_EMAIL);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to send OTP' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      requiresOTP: true,
      message: 'OTP sent to your email',
    });
  } catch (error) {
    console.error('[Admin Login] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
