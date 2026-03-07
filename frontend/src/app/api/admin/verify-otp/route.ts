import { NextRequest, NextResponse } from 'next/server';
import { adminOTPService } from '@/services/admin-otp.service';
import { signToken } from '@/lib/jwt';
import { UserRole } from '@intellicampus/shared';
import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    // Verify email matches admin
    if (email?.toLowerCase() !== env.ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Invalid email' },
        { status: 401 }
      );
    }

    // Verify OTP
    const result = await adminOTPService.verifyOTP(env.ADMIN_EMAIL, otp);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Invalid OTP' },
        { status: 401 }
      );
    }

    // Generate JWT token for admin
    const token = signToken({
      userId: 'admin',
      email: env.ADMIN_EMAIL,
      role: UserRole.ADMIN,
      institutionId: 'admin',
    });

    return NextResponse.json({
      success: true,
      message: 'Admin login successful',
      data: {
        user: {
          id: 'admin',
          name: 'Admin',
          email: env.ADMIN_EMAIL,
          role: 'admin',
          institutionId: 'admin',
        },
        token,
      },
    });
  } catch (error) {
    console.error('[Admin Verify OTP] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
