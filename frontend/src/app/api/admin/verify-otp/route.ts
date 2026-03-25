import { NextRequest, NextResponse } from 'next/server';
import { adminOTPService } from '@/services/admin-otp.service';
import { signToken } from '@/lib/jwt';
import { UserRole } from '@intellicampus/shared';
import { env } from '@/lib/env';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: 'Missing email or OTP' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();

    // Verify OTP
    const result = await adminOTPService.verifyOTP(normalizedEmail, otp);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Invalid OTP' },
        { status: 401 }
      );
    }

    // Look up the admin user in the database
    let adminUser = null;
    try {
      adminUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          institutionId: true,
        },
      });
    } catch (dbError) {
      console.error('[Admin Verify OTP] Database lookup failed:', dbError);
    }

    // If user not in database, create a fallback (for env-based admin)
    if (!adminUser) {
      console.warn('[Admin Verify OTP] No database user found, using fallback admin');
      // Try to get the first institution
      let institutionId = 'admin';
      try {
        const firstInstitution = await prisma.institution.findFirst();
        if (firstInstitution) {
          institutionId = firstInstitution.id;
        }
      } catch (err) {
        console.error('[Admin Verify OTP] Failed to fetch institution:', err);
      }

      adminUser = {
        id: `admin-${Date.now()}`,
        name: 'Admin',
        email: normalizedEmail,
        role: 'admin',
        institutionId,
      };
    } else if (adminUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'User is not an admin' },
        { status: 403 }
      );
    }

    console.log('[Admin Verify OTP] Login successful:', {
      userId: adminUser.id,
      email: adminUser.email,
      institutionId: adminUser.institutionId,
    });

    // Generate JWT token with real user data
    const token = signToken({
      userId: adminUser.id,
      email: adminUser.email,
      role: UserRole.ADMIN,
      institutionId: adminUser.institutionId,
    });

    return NextResponse.json({
      success: true,
      message: 'Admin login successful',
      data: {
        user: {
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
          role: 'admin',
          institutionId: adminUser.institutionId,
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
