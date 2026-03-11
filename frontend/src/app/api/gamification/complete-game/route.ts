import { NextRequest, NextResponse } from 'next/server';
import { XPSource } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const STAGE_KEY_MAP: Record<string, number> = {
  data_structures: 1,
  analysis_of_algorithms: 2,
  computer_networks: 3,
  operating_systems: 4,
};

const XP_REWARDS: Record<string, { amount: number; source: XPSource }> = {
  sprint: { amount: 100, source: XPSource.quiz },
  spin: { amount: 100, source: XPSource.spin_wheel },
  flashcards: { amount: 200, source: XPSource.flashcard },
  boss: { amount: 300, source: XPSource.boss_battle },
};

const GAME_ORDER = ['sprint', 'spin', 'flashcards', 'boss'];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, gameType } = body;
    // Accept stageKey (string) or stageId (number)
    let stageId: number;
    if (body.stageKey && STAGE_KEY_MAP[body.stageKey]) {
      stageId = STAGE_KEY_MAP[body.stageKey];
    } else if (body.stageId && [1, 2, 3, 4].includes(body.stageId)) {
      stageId = body.stageId;
    } else {
      return NextResponse.json(
        { error: 'Missing or invalid stage. Provide stageKey or stageId (1-4)' },
        { status: 400 }
      );
    }

    if (!userId || !gameType) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, gameType' },
        { status: 400 }
      );
    }

    const gameTypeKey = gameType.toLowerCase();
    if (!XP_REWARDS[gameTypeKey]) {
      return NextResponse.json(
        { error: `Invalid gameType: ${gameType}. Must be sprint, spin, flashcards, or boss` },
        { status: 400 }
      );
    }

    // Get current stage progress
    let stageProgress = await prisma.stageProgress.findUnique({
      where: { userId_stageId: { userId, stageId } },
    });

    if (!stageProgress) {
      stageProgress = await prisma.stageProgress.create({
        data: { userId, stageId, completedGames: 0, progress: 0 },
      });
    }

    // Check game unlock: game N requires N completed games
    const gameIndex = GAME_ORDER.indexOf(gameTypeKey);
    if (stageProgress.completedGames < gameIndex) {
      return NextResponse.json(
        { error: `Game locked. Complete previous games first.`, locked: true },
        { status: 403 }
      );
    }

    // Prevent re-completing already-completed game slots
    if (stageProgress.completedGames > gameIndex) {
      return NextResponse.json(
        { error: 'This game has already been completed for this stage.', alreadyComplete: true },
        { status: 400 }
      );
    }

    if (stageProgress.completedGames >= 4) {
      return NextResponse.json(
        { error: 'Stage already completed.', alreadyComplete: true },
        { status: 400 }
      );
    }

    const xpReward = XP_REWARDS[gameTypeKey];

    const result = await prisma.$transaction(async (tx) => {
      const newCompletedGames = stageProgress!.completedGames + 1;
      const newProgress = Math.round((newCompletedGames / 4) * 100);

      const updatedStageProgress = await tx.stageProgress.update({
        where: { userId_stageId: { userId, stageId } },
        data: { completedGames: newCompletedGames, progress: newProgress },
      });

      await tx.xPLog.create({
        data: { userId, source: xpReward.source, xpAmount: xpReward.amount },
      });

      let studentXp = await tx.studentXP.findUnique({ where: { userId } });
      if (!studentXp) {
        studentXp = await tx.studentXP.create({
          data: { userId, totalXp: 0, level: 1, streakDays: 0 },
        });
      }

      const newTotalXp = studentXp.totalXp + xpReward.amount;
      const newLevel = Math.floor(newTotalXp / 1000) + 1;

      const updatedStudentXp = await tx.studentXP.update({
        where: { userId },
        data: { totalXp: newTotalXp, level: newLevel, lastActivityDate: new Date() },
      });

      return { stageProgress: updatedStageProgress, studentXp: updatedStudentXp };
    });

    return NextResponse.json({
      success: true,
      message: `Completed ${gameType}! Earned ${xpReward.amount} XP`,
      data: {
        stageProgress: result.stageProgress,
        xpEarned: xpReward.amount,
        totalXp: result.studentXp.totalXp,
        level: result.studentXp.level,
        completedGames: result.stageProgress.completedGames,
        progress: result.stageProgress.progress,
        dropletsRemaining: 4 - result.stageProgress.completedGames,
      },
    });
  } catch (error: unknown) {
    console.error('Error completing game:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
