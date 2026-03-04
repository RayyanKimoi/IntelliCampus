import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@/utils/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { userService } = await import('@/services/user.service');
    const result = await userService.register(parsed.data);
    return NextResponse.json(
      { success: true, data: result, message: 'Registration successful' },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 409 }
    );
  }
}
