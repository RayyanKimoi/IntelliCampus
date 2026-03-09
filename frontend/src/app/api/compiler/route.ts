import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// JDoodle API — https://www.jdoodle.com/compiler-api
const JDOODLE_URL = 'https://api.jdoodle.com/v1/execute';
const JDOODLE_CLIENT_ID = process.env.JDOODLE_CLIENT_ID || '';
const JDOODLE_CLIENT_SECRET = process.env.JDOODLE_CLIENT_SECRET || '';

// Map editor language names → JDoodle language slug + versionIndex
const LANGUAGE_MAP: Record<string, { language: string; versionIndex: string }> = {
  python:     { language: 'python3', versionIndex: '3' }, // Python 3.9.7
  javascript: { language: 'nodejs',  versionIndex: '4' }, // Node.js 17
  js:         { language: 'nodejs',  versionIndex: '4' },
  java:       { language: 'java',    versionIndex: '4' }, // JDK 17
  cpp:        { language: 'cpp17',   versionIndex: '1' }, // GCC C++17
  'c++':      { language: 'cpp17',   versionIndex: '1' },
  c:          { language: 'c',       versionIndex: '5' }, // GCC C
};

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT, UserRole.TEACHER]);

    if (!JDOODLE_CLIENT_ID || !JDOODLE_CLIENT_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Compiler service is not configured. Set JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET in .env.' },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { code, language, input } = body;

    if (!code || !language) {
      return NextResponse.json(
        { success: false, error: 'Code and language are required' },
        { status: 400 }
      );
    }

    const lang = LANGUAGE_MAP[language.toLowerCase()];
    if (!lang) {
      return NextResponse.json(
        { success: false, error: `Unsupported language: ${language}` },
        { status: 400 }
      );
    }

    const jdoodleRes = await fetch(JDOODLE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: JDOODLE_CLIENT_ID,
        clientSecret: JDOODLE_CLIENT_SECRET,
        script: code,
        language: lang.language,
        versionIndex: lang.versionIndex,
        stdin: input || '',
      }),
    });

    if (!jdoodleRes.ok) {
      const errorText = await jdoodleRes.text();
      console.error('[Compiler API] JDoodle error:', jdoodleRes.status, errorText);
      const friendlyError =
        jdoodleRes.status === 401 || jdoodleRes.status === 403
          ? 'JDoodle API credentials are invalid. Check JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET in .env.'
          : jdoodleRes.status === 429
          ? 'Daily compilation limit reached. Try again tomorrow.'
          : `Compiler service error (${jdoodleRes.status}): ${errorText}`;
      return NextResponse.json({ success: false, error: friendlyError }, { status: 500 });
    }

    const data = await jdoodleRes.json();

    // JDoodle returns statusCode 429 in the body when daily limit is hit (HTTP 200)
    if (data.statusCode === 429) {
      return NextResponse.json(
        { success: false, error: 'Daily compilation limit reached. Try again tomorrow.' },
        { status: 429 }
      );
    }

    // JDoodle merges stdout + stderr into a single `output` field
    const output: string = data.output || '';

    return NextResponse.json({
      success: true,
      data: {
        stdout: output,
        stderr: '',
        compile_output: '',
        status: 'Accepted',
        time: data.cpuTime || '0',
        memory: data.memory || '0',
      },
    });
  } catch (error: any) {
    console.error('[Compiler API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Compilation failed' },
      { status: 500 }
    );
  }
}
