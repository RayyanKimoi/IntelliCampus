import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, ['admin']);
    
    const policy = await prisma.aIPolicySettings.findUnique({
      where: { institutionId: user.institutionId }
    });

    if (!policy) {
      // Return default policy
      return NextResponse.json(
        {
          success: true,
          data: {
            institutionId: user.institutionId,
            hintModeOnly: false,
            strictExamMode: false,
            maxTokens: 1024
          }
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: true, data: policy },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message.includes('Authentication') ? 401 : error.message.includes('permissions') ? 403 : 400 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, ['admin']);
    
    const body = await req.json();

    const policy = await prisma.aIPolicySettings.upsert({
      where: { institutionId: user.institutionId },
      update: body,
      create: {
        institutionId: user.institutionId,
        ...body
      }
    });

    return NextResponse.json(
      { success: true, data: policy, message: 'Policy updated' },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message.includes('Authentication') ? 401 : error.message.includes('permissions') ? 403 : 400 }
    );
  }
}
