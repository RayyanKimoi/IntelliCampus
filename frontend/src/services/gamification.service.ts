import { prisma } from '@/lib/prisma';
import { GAMIFICATION } from '@intellicampus/shared';
import { masteryService } from './mastery.service';
import { logger } from '@/utils/logger';

export class GamificationService {
  // ========================
  // XP System
  // ========================

  /**
   * Award XP and update level
   */
  async awardXP(userId: string, source: string, xpAmount: number) {
    // Log the XP
    await prisma.xPLog.create({
      data: {
        userId,
        source: source as any,
        xpAmount,
      },
    });

    // Update total XP and check level
    const xpRecord = await prisma.studentXP.upsert({
      where: { userId },
      create: {
        userId,
        totalXp: xpAmount,
        level: 1,
        lastActivityDate: new Date(),
      },
      update: {
        totalXp: { increment: xpAmount },
        lastActivityDate: new Date(),
      },
    });

    // Calculate level: level = floor(totalXp / LEVEL_XP_MULTIPLIER) + 1
    const newLevel = Math.floor(xpRecord.totalXp / GAMIFICATION.LEVEL_XP_MULTIPLIER) + 1;
    if (newLevel !== xpRecord.level) {
      await prisma.studentXP.update({
        where: { userId },
        data: { level: newLevel },
      });
    }

    return { totalXp: xpRecord.totalXp + xpAmount, level: newLevel, xpAwarded: xpAmount };
  }

  /**
   * Update streak
   */
  async updateStreak(userId: string) {
    const xpRecord = await prisma.studentXP.findUnique({
      where: { userId },
    });

    if (!xpRecord) return;

    const today = new Date();
    const lastActive = new Date(xpRecord.lastActivityDate);
    const diffDays = Math.floor(
      (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
    );

    let newStreak = xpRecord.streakDays;
    if (diffDays === 1) {
      newStreak += 1;
      // Award streak XP
      await this.awardXP(userId, 'streak', GAMIFICATION.XP_PER_STREAK_DAY);
    } else if (diffDays > 1) {
      newStreak = 1; // Reset streak
    }
    // diffDays === 0 means same day, no streak change

    await prisma.studentXP.update({
      where: { userId },
      data: { streakDays: newStreak },
    });

    return newStreak;
  }

  /**
   * Get student XP profile
   */
  async getStudentXP(userId: string) {
    const xp = await prisma.studentXP.findUnique({
      where: { userId },
    });

    if (!xp) {
      return prisma.studentXP.create({
        data: { userId },
      });
    }

    const xpForNextLevel = (xp.level) * GAMIFICATION.LEVEL_XP_MULTIPLIER;
    const xpProgress = xp.totalXp % GAMIFICATION.LEVEL_XP_MULTIPLIER;

    return {
      ...xp,
      xpForNextLevel,
      xpProgress,
      progressPercent: Math.round((xpProgress / GAMIFICATION.LEVEL_XP_MULTIPLIER) * 100),
    };
  }

  /**
   * Get XP leaderboard
   */
  async getLeaderboard(limit = 10) {
    return prisma.studentXP.findMany({
      take: limit,
      orderBy: { totalXp: 'desc' },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });
  }

  // ========================
  // Boss Battle
  // ========================

  /**
   * Start a boss battle
   */
  async startBossBattle(userId: string, topicId: string) {
    // Check for active battles
    const active = await prisma.bossBattle.findFirst({
      where: { userId, status: 'active' },
    });

    if (active) {
      throw new Error('You already have an active boss battle. Finish or forfeit it first.');
    }

    const battle = await prisma.bossBattle.create({
      data: {
        userId,
        topicId,
        bossHp: GAMIFICATION.BOSS_DEFAULT_HP,
        playerHp: GAMIFICATION.PLAYER_DEFAULT_HP,
        status: 'active',
      },
      include: {
        topic: true,
      },
    });

    logger.info('GamificationService', `Boss battle started: ${battle.id}`);
    return battle;
  }

  /**
   * Process a boss battle answer
   */
  async processBattleAnswer(
    battleId: string,
    userId: string,
    isCorrect: boolean,
    topicId: string
  ) {
    const battle = await prisma.bossBattle.findUnique({
      where: { id: battleId },
    });

    if (!battle || battle.userId !== userId) {
      throw new Error('Battle not found');
    }

    if (battle.status !== 'active') {
      throw new Error('Battle is not active');
    }

    let newBossHp = battle.bossHp;
    let newPlayerHp = battle.playerHp;

    if (isCorrect) {
      newBossHp -= GAMIFICATION.BOSS_DAMAGE_PER_CORRECT;
    } else {
      newPlayerHp -= GAMIFICATION.PLAYER_DAMAGE_PER_WRONG;
    }

    // Determine battle outcome
    let status: 'active' | 'won' | 'lost' = 'active';
    if (newBossHp <= 0) {
      status = 'won';
      newBossHp = 0;
      await this.awardXP(userId, 'boss_battle', GAMIFICATION.XP_PER_BOSS_BATTLE_WIN);
    } else if (newPlayerHp <= 0) {
      status = 'lost';
      newPlayerHp = 0;
    }

    const updated = await prisma.bossBattle.update({
      where: { id: battleId },
      data: {
        bossHp: newBossHp,
        playerHp: newPlayerHp,
        status: status as any,
        ...(status !== 'active' && { endedAt: new Date() }),
      },
    });

    // Update mastery
    await masteryService.updateMastery(userId, topicId, isCorrect, 0);

    return {
      ...updated,
      isCorrect,
      damageDealt: isCorrect ? GAMIFICATION.BOSS_DAMAGE_PER_CORRECT : 0,
      damageTaken: !isCorrect ? GAMIFICATION.PLAYER_DAMAGE_PER_WRONG : 0,
    };
  }

  /**
   * Get active battle
   */
  async getActiveBattle(userId: string) {
    return prisma.bossBattle.findFirst({
      where: { userId, status: 'active' },
      include: { topic: true },
    });
  }

  /**
   * Get battle history
   */
  async getBattleHistory(userId: string) {
    return prisma.bossBattle.findMany({
      where: { userId },
      include: { topic: true },
      orderBy: { startedAt: 'desc' },
      take: 20,
    });
  }

  // ========================
  // Flashcards
  // ========================

  /**
   * Get flashcards for a topic
   */
  async getFlashcards(userId: string, topicId: string) {
    return prisma.flashcardProgress.findMany({
      where: { userId, topicId },
      orderBy: [
        { known: 'asc' },
        { repetitionCount: 'asc' },
      ],
    });
  }

  /**
   * Create/add a flashcard
   */
  async addFlashcard(userId: string, topicId: string, cardText: string) {
    return prisma.flashcardProgress.create({
      data: {
        userId,
        topicId,
        cardText,
      },
    });
  }

  /**
   * Update flashcard progress
   */
  async updateFlashcard(flashcardId: string, known: boolean) {
    const card = await prisma.flashcardProgress.update({
      where: { id: flashcardId },
      data: {
        known,
        repetitionCount: { increment: 1 },
        lastReviewed: new Date(),
      },
    });

    return card;
  }

  // ========================
  // Spin the Wheel
  // ========================

  /**
   * Spin the wheel and get a reward
   */
  async spinWheel(userId: string) {
    // Check daily spin limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const spinsToday = await prisma.spinReward.count({
      where: {
        userId,
        createdAt: { gte: today },
      },
    });

    if (spinsToday >= 3) {
      throw new Error('Maximum daily spins reached (3 per day)');
    }

    // Random reward
    const rewards = [
      { type: 'xp_boost', value: '50', label: '50 XP Boost!' },
      { type: 'xp_boost', value: '25', label: '25 XP Boost!' },
      { type: 'hint_token', value: '1', label: 'Hint Token!' },
      { type: 'bonus_quiz', value: '1', label: 'Bonus Quiz!' },
      { type: 'streak_bonus', value: '1', label: 'Streak Shield!' },
      { type: 'xp_boost', value: '100', label: '100 XP Jackpot!' },
    ];

    const reward = rewards[Math.floor(Math.random() * rewards.length)];

    const spinReward = await prisma.spinReward.create({
      data: {
        userId,
        rewardType: reward.type as any,
        rewardValue: reward.value,
      },
    });

    // Apply XP rewards immediately
    if (reward.type === 'xp_boost') {
      await this.awardXP(userId, 'spin_wheel', parseInt(reward.value));
    }

    logger.info('GamificationService', `Spin reward: ${reward.label} for user ${userId}`);

    return {
      ...spinReward,
      label: reward.label,
      spinsRemaining: 2 - spinsToday,
    };
  }
}

export const gamificationService = new GamificationService();
