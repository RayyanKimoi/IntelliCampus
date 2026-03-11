import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const STAGE_KEY_MAP: Record<string, number> = {
  data_structures: 1,
  analysis_of_algorithms: 2,
  computer_networks: 3,
  operating_systems: 4,
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const stageKey = searchParams.get('stage');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Get student XP
    const studentXp = await prisma.studentXP.findUnique({
      where: { userId },
    });

    const xp = studentXp?.totalXp ?? 0;
    const level = studentXp?.level ?? 1;

    // Single stage query
    if (stageKey && STAGE_KEY_MAP[stageKey]) {
      const stageId = STAGE_KEY_MAP[stageKey];
      const progress = await prisma.stageProgress.findUnique({
        where: { userId_stageId: { userId, stageId } },
      });

      return NextResponse.json({
        completedGames: progress?.completedGames ?? 0,
        progress: progress?.progress ?? 0,
        dropletsRemaining: 4 - (progress?.completedGames ?? 0),
        xp,
        level,
      });
    }

    // All stages
    const allProgress = await prisma.stageProgress.findMany({
      where: { userId },
      orderBy: { stageId: 'asc' },
    });

    // Build a map of stageId -> progress
    const stageMap: Record<number, { completedGames: number; progress: number }> = {};
    for (const p of allProgress) {
      stageMap[p.stageId] = {
        completedGames: p.completedGames,
        progress: p.progress,
      };
    }

    // Return all 4 stages
    const stages = [1, 2, 3, 4].map((stageId) => {
      const data = stageMap[stageId];
      return {
        stageId,
        completedGames: data?.completedGames ?? 0,
        progress: data?.progress ?? 0,
        dropletsRemaining: 4 - (data?.completedGames ?? 0),
      };
    });

    return NextResponse.json({
      stages,
      xp,
      level,
      streakDays: studentXp?.streakDays ?? 0,
    });
  } catch (error: unknown) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
