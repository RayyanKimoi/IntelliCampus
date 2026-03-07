import { NextResponse } from 'next/server';
import { MOCK_TEACHER_COURSES_RICH } from '@/lib/mockData';

export async function GET() {
  try {
    // In a real app this would check the session and fetch from DB
    return NextResponse.json({
      success: true,
      data: MOCK_TEACHER_COURSES_RICH
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}
