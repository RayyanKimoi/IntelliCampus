import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/utils/validators';
import { signToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─── Demo accounts ────────────────────────────────────────────────────────────
const DEMO_USERS: Record<string, { id: string; name: string; email: string; password: string; role: string; institutionId: string }> = {
  'student@campus.edu': { id: 'demo-student-1', name: 'Alex Johnson',   email: 'student@campus.edu', password: 'student123', role: 'student', institutionId: 'demo-inst' },
  'teacher@campus.edu': { id: 'cmlsdjpz40005wsxkb3j2mdah', name: 'Dr. Sarah Chen', email: 'teacher@campus.edu', password: 'teacher123', role: 'teacher', institutionId: 'cmlsdjpz10003wsxk8v8s00gg' },
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

    // ── 1. Demo credentials — check first, but resolve real institutionId from DB ──
    const demo = DEMO_USERS[email.toLowerCase()];
    if (demo) {
      if (demo.password !== password) {
        return NextResponse.json(
          { success: false, error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Resolve the real institutionId: prefer existing DB user, then first institution
      let resolvedId = demo.id;
      let resolvedInstitutionId = demo.institutionId;
      try {
        const dbUser = await prisma.user.findUnique({ where: { email: demo.email } });
        if (dbUser) {
          resolvedId = dbUser.id;
          resolvedInstitutionId = dbUser.institutionId;
        } else {
          const firstInstitution = await prisma.institution.findFirst();
          if (firstInstitution) resolvedInstitutionId = firstInstitution.id;
        }
      } catch {
        // DB unavailable — fall back to hardcoded values
      }

      const token = signToken({ 
        userId: resolvedId, 
        email: demo.email, 
        role: demo.role as any, 
        institutionId: resolvedInstitutionId 
      });
      const { password: _pw, ...demoUser } = demo;
      const user = { ...demoUser, id: resolvedId, institutionId: resolvedInstitutionId };
      
      console.log('[Auth API] Demo login successful:', { email: demo.email, role: demo.role, institutionId: resolvedInstitutionId });
      
      return NextResponse.json(
        { success: true, data: { user, token }, message: 'Login successful' },
        { status: 200 }
      );
    }

    // ── 2. Real database for non-demo accounts ────
    console.log('[Auth API] Attempting database login for:', email);
    
    try {
      const { userService } = await import('@/services/user.service');
      
      // Perform database login with bcrypt comparison
      console.log('[Auth API] Calling userService.login...');
      const result = await userService.login(email, password);
      
      console.log('[Auth API] Database login successful:', {
        email: result.user.email,
        role: result.user.role,
        userId: result.user.id
      });
      
      return NextResponse.json(
        { success: true, data: result, message: 'Login successful' },
        { status: 200 }
      );
    } catch (dbError: any) {
      console.error('[Auth API] Database login failed:', {
        email,
        error: dbError.message,
        stack: dbError.stack?.split('\n')[0]
      });
      
      return NextResponse.json(
        { success: false, error: dbError.message || 'Invalid email or password' },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error('[Auth API] Login error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
