import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for compilation

// Judge0 API Configuration - use RAPIDAPI_KEY from .env
const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';

// Language ID mapping for Judge0
const LANGUAGE_MAP: Record<string, number> = {
  'cpp': 54,      // C++ (GCC 9.2.0)
  'c++': 54,
  'java': 62,     // Java (OpenJDK 13.0.1)
  'python': 71,   // Python (3.8.1)
  'c': 50,        // C (GCC 9.2.0)
  'javascript': 63, // JavaScript (Node.js 12.14.0)
  'js': 63,
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

    // Submit code to Judge0 with async pattern to prevent timeouts
    const submissionResponse = await fetch(`${JUDGE0_API_URL}/submissions?base64_encoded=false`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
      },
      body: JSON.stringify({
        source_code: code,
        language_id: languageId,
        stdin: input || '',
      }),
    });

    if (!submissionResponse.ok) {
      const errorText = await submissionResponse.text();
      console.error('[Compiler API] Judge0 submission failed:', errorText);
      return NextResponse.json(
        { success: false, error: 'Failed to submit code to compiler' },
        { status: 500 }
      );
    }

    const submissionData = await submissionResponse.json();
    const token = submissionData.token;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No submission token received' },
        { status: 500 }
      );
    }

    // Poll for result (max 10 attempts, 1 second intervals)
    let attempts = 0;
    const maxAttempts = 10;
    let result: any = null;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const resultResponse = await fetch(`${JUDGE0_API_URL}/submissions/${token}?base64_encoded=false`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        },
      });

      if (resultResponse.ok) {
        result = await resultResponse.json();
        
        // Check if processing is complete
        if (result.status?.id > 2) { // Status ID > 2 means completed/error/rejected
          break;
        }
      }

      attempts++;
    }

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Compilation timeout' },
        { status: 408 }
      );
    }

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
