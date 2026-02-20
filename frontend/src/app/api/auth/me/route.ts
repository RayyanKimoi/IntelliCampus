import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─── Demo user registry (mirrors the login route) ────────────────────────────
const DEMO_USERS: Record<string, { id: string; name: string; email: string; role: string; institutionId: string }> = {
  'demo-student-1': { id: 'demo-student-1', name: 'Alex Johnson',  email: 'student@campus.edu', role: 'student', institutionId: 'demo-inst' },
  'demo-teacher-1': { id: 'demo-teacher-1', name: 'Dr. Sarah Chen', email: 'teacher@campus.edu', role: 'teacher', institutionId: 'demo-inst' },
  'demo-admin-1':   { id: 'demo-admin-1',   name: 'Admin User',    email: 'admin@campus.edu',   role: 'admin',   institutionId: 'demo-inst' },
};

export async function GET(req: NextRequest) {
  try {
    const authPayload = getAuthUser(req);

    // ── 1. Try real database ──────────────────────────────────────────────────
    try {
      const { userService } = await import('@/services/user.service');
      const userData = await userService.getUserById(authPayload.userId);
      if (userData) {
        return NextResponse.json({ success: true, data: userData }, { status: 200 });
      }
    } catch {
      // DB unavailable — fall through to demo lookup
    }

    // ── 2. Demo user fallback ─────────────────────────────────────────────────
    const demo = DEMO_USERS[authPayload.userId];
    if (demo) {
      return NextResponse.json({ success: true, data: demo }, { status: 200 });
    }

    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
}
