import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_POLICY = {
  rapidGuessingEnabled: true,
  rapidGuessingThreshold: 10,
  tabSwitchingEnabled: true,
  tabSwitchingThreshold: 5,
  copyPasteEnabled: true,
  highAnomalyEnabled: true,
  unusualPatternEnabled: true,
  fastCompletionEnabled: true,
  fastCompletionThreshold: 40,
  multipleReattemptEnabled: true,
  similarityDetectedEnabled: true,
  similarityThreshold: 80,
};

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.ADMIN]);

    let policy = await prisma.integrityPolicy.findFirst({
      where: { institutionId: user.institutionId },
    });

    if (!policy) {
      policy = await prisma.integrityPolicy.create({
        data: {
          institutionId: user.institutionId,
          ...DEFAULT_POLICY,
        },
      });
    }

    return NextResponse.json({ success: true, data: policy });
  } catch (error: any) {
    console.error('[GET /api/admin/integrity-policy]', error);
    const status = error.message?.includes('Authentication') ? 401
      : error.message?.includes('permissions') ? 403 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.ADMIN]);

    const body = await req.json();

    // Whitelist allowed fields to prevent injection
    const allowed = [
      'rapidGuessingEnabled', 'rapidGuessingThreshold',
      'tabSwitchingEnabled', 'tabSwitchingThreshold',
      'copyPasteEnabled', 'highAnomalyEnabled', 'unusualPatternEnabled',
      'fastCompletionEnabled', 'fastCompletionThreshold',
      'multipleReattemptEnabled',
      'similarityDetectedEnabled', 'similarityThreshold',
    ];
    const updateData: Record<string, any> = {};
    for (const key of allowed) {
      if (key in body) updateData[key] = body[key];
    }

    const policy = await prisma.integrityPolicy.upsert({
      where: { institutionId: user.institutionId },
      create: {
        institutionId: user.institutionId,
        ...DEFAULT_POLICY,
        ...updateData,
      },
      update: updateData,
    });

    return NextResponse.json({ success: true, data: policy });
  } catch (error: any) {
    console.error('[PATCH /api/admin/integrity-policy]', error);
    const status = error.message?.includes('Authentication') ? 401
      : error.message?.includes('permissions') ? 403 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
