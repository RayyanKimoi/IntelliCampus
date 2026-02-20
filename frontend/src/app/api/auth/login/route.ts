import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/services/user.service';
import { loginSchema } from '@/utils/validators';
import { signToken } from '@/lib/jwt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─── Demo accounts ────────────────────────────────────────────────────────────
const DEMO_USERS: Record<string, { id: string; name: string; email: string; password: string; role: string; institutionId: string }> = {
  'student@campus.edu': { id: 'demo-student-1', name: 'Alex Johnson',   email: 'student@campus.edu', password: 'student123', role: 'student', institutionId: 'demo-inst' },
  'teacher@campus.edu': { id: 'demo-teacher-1', name: 'Dr. Sarah Chen', email: 'teacher@campus.edu', password: 'teacher123', role: 'teacher', institutionId: 'demo-inst' },
  'admin@campus.edu':   { id: 'demo-admin-1',   name: 'Admin User',     email: 'admin@campus.edu',   password: 'admin123',   role: 'admin',   institutionId: 'demo-inst' },
};

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

    const { email, password } = parsed.data;

    // ── 1. Demo credentials — always checked first, always work ───────────────
    const demo = DEMO_USERS[email.toLowerCase()];
    if (demo) {
      if (demo.password !== password) {
        return NextResponse.json(
          { success: false, error: 'Invalid email or password' },
          { status: 401 }
        );
      }
      const token = signToken({ userId: demo.id, email: demo.email, role: demo.role as any, institutionId: demo.institutionId });
      const { password: _pw, ...user } = demo;
      return NextResponse.json(
        { success: true, data: { user, token }, message: 'Login successful' },
        { status: 200 }
      );
    }

    // ── 2. Real database for non-demo accounts ────────────────────────────────
    try {
      const result = await userService.login(email, password);
      return NextResponse.json(
        { success: true, data: result, message: 'Login successful' },
        { status: 200 }
      );
    } catch (dbError: any) {
      return NextResponse.json(
        { success: false, error: dbError.message || 'Invalid email or password' },
        { status: 401 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 401 }
    );
  }
}
