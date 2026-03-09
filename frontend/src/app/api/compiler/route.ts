import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Judge0 API Configuration
const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || '';

// Language ID mapping for Judge0
const LANGUAGE_MAP: Record<string, number> = {
  'cpp': 54,      // C++ (GCC 9.2.0)
  'java': 62,     // Java (OpenJDK 13.0.1)
  'python': 71,   // Python (3.8.1)
  'c': 50,        // C (GCC 9.2.0)
  'javascript': 63, // JavaScript (Node.js 12.14.0)
};

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT, UserRole.TEACHER]);

    const body = await req.json();
    const { code, language, input } = body;

    if (!code || !language) {
      return NextResponse.json(
        { success: false, error: 'Code and language are required' },
        { status: 400 }
      );
    }

    const languageId = LANGUAGE_MAP[language.toLowerCase()];
    if (!languageId) {
      return NextResponse.json(
        { success: false, error: `Unsupported language: ${language}` },
        { status: 400 }
      );
    }

    // Submit code to Judge0
    const submissionResponse = await fetch(`${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': JUDGE0_API_KEY,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
      },
      body: JSON.stringify({
        source_code: code,
        language_id: languageId,
        stdin: input || '',
      }),
    });

    if (!submissionResponse.ok) {
      console.error('[Compiler API] Judge0 submission failed:', await submissionResponse.text());
      return NextResponse.json(
        { success: false, error: 'Failed to submit code to compiler' },
        { status: 500 }
      );
    }

    const result = await submissionResponse.json();

    // Format the response
    return NextResponse.json({
      success: true,
      data: {
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        compile_output: result.compile_output || '',
        status: result.status?.description || 'Unknown',
        time: result.time || '0',
        memory: result.memory || '0',
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
