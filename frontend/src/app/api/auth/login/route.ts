import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/services/user.service';
import { loginSchema } from '@/utils/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const result = await userService.login(parsed.data.email, parsed.data.password);
    return NextResponse.json(
      { success: true, data: result, message: 'Login successful' },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 401 }
    );
  }
}
