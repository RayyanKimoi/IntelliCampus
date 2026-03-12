import { prisma } from '@/lib/prisma';
import { GAMIFICATION } from '@intellicampus/shared';
import { masteryService } from './mastery.service';
import { logger } from '@/utils/logger';

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

const DEFAULT_BADGES = [
  {
    key: 'first_steps',
    name: 'First Steps',
    description: 'Earn your first XP in IntelliCampus.',
    icon: 'Star',
    sortOrder: 1,
  },
  {
    key: 'streak_5',
    name: '5 Day Streak',
    description: 'Maintain a 5 day study streak.',
    icon: 'Flame',
    sortOrder: 2,
  },
  {
    key: 'quiz_master',
    name: 'Quiz Master',
    description: 'Score a perfect quiz performance.',
    icon: 'Target',
    sortOrder: 3,
  },
  {
    key: 'boss_slayer',
    name: 'Boss Slayer',
    description: 'Win 5 boss battles.',
    icon: 'Swords',
    sortOrder: 4,
  },
  {
    key: 'xp_hunter',
    name: 'XP Hunter',
    description: 'Reach 1000 total XP.',
    icon: 'Zap',
    sortOrder: 5,
  },
] as const;

function getCurrentWeekBounds(now = new Date()) {
  const start = new Date(now);
  const day = start.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  return { start, end };
}

function getWeekdayIndex(date: Date) {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

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

    // Recalculate level in case it was stored with the wrong divisor
    const correctLevel = Math.floor(xp.totalXp / GAMIFICATION.LEVEL_XP_MULTIPLIER) + 1;
    if (correctLevel !== xp.level) {
      await prisma.studentXP.update({ where: { userId }, data: { level: correctLevel } });
    }
    const level = correctLevel;

    const xpForNextLevel = level * GAMIFICATION.LEVEL_XP_MULTIPLIER;
    const xpProgress = xp.totalXp % GAMIFICATION.LEVEL_XP_MULTIPLIER;

    return {
      ...xp,
      level,
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

  async getWeeklyStreak(userId: string) {
    const { start, end } = getCurrentWeekBounds();

    const [xpProfile, logs] = await Promise.all([
      prisma.studentXP.findUnique({ where: { userId } }),
      prisma.xPLog.findMany({
        where: {
          userId,
          createdAt: {
            gte: start,
            lt: end,
          },
        },
        select: { createdAt: true },
      }),
    ]);

    const completed = new Set<number>();
    for (const log of logs) {
      completed.add(getWeekdayIndex(log.createdAt));
    }

    const weeklyCompletion = WEEKDAY_LABELS.map((day, index) => ({
      day,
      completed: completed.has(index),
    }));

    return {
      currentStreak: xpProfile?.streakDays ?? 0,
      weeklyCompletion,
    };
  }

  async getWeeklyLeaderboard(currentUserId: string, limit = 10) {
    const { start, end } = getCurrentWeekBounds();
    const grouped = await prisma.xPLog.groupBy({
      by: ['userId'],
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
      _sum: {
        xpAmount: true,
      },
      orderBy: {
        _sum: {
          xpAmount: 'desc',
        },
      },
    });

    const ranked = grouped.map((entry, index) => ({
      userId: entry.userId,
      weeklyXp: entry._sum.xpAmount ?? 0,
      rank: index + 1,
    }));

    const userIds = ranked.map((entry) => entry.userId);
    const users = userIds.length
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: {
            id: true,
            name: true,
            profile: { select: { avatarUrl: true } },
            studentXp: { select: { level: true, totalXp: true } },
          },
        })
      : [];

    const userMap = new Map(users.map((user) => [user.id, user]));
    const entries = ranked
      .map((entry) => {
        const user = userMap.get(entry.userId);
        if (!user) return null;
        return {
          rank: entry.rank,
          userId: entry.userId,
          name: user.name,
          avatarUrl: user.profile?.avatarUrl ?? null,
          level: user.studentXp?.level ?? 1,
          weeklyXp: entry.weeklyXp,
          isCurrentUser: entry.userId === currentUserId,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

    const leaders = entries.slice(0, limit);
    const currentUser = entries.find((entry) => entry.userId === currentUserId) ?? null;
    const includeCurrentUser = currentUser && !leaders.some((entry) => entry.userId === currentUser.userId);

    return {
      leaders: includeCurrentUser ? [...leaders, currentUser] : leaders,
      podium: entries.slice(0, 3),
      currentUser,
      weekStart: start,
      weekEndExclusive: end,
    };
  }

  async getBadges(userId: string) {
    try {
      // Check if Badge model exists on Prisma client
      if (!('badge' in prisma) || !('userBadge' in prisma)) {
        console.warn('[Gamification] Badge models not available in Prisma client. Run prisma generate.');
        // Return default badges as locked
        return DEFAULT_BADGES.map((badge) => ({
          id: badge.key,
          key: badge.key,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          unlocked: false,
          unlockedAt: null,
        }));
      }

      await Promise.all(
        DEFAULT_BADGES.map((badge) =>
          (prisma as any).badge.upsert({
            where: { key: badge.key },
            update: {
              name: badge.name,
              description: badge.description,
              icon: badge.icon,
              sortOrder: badge.sortOrder,
            },
            create: badge,
          })
        )
      );

      const [badges, xpProfile, bossWins, perfectQuiz, existingUserBadges] = await Promise.all([
        (prisma as any).badge.findMany({
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        }),
        prisma.studentXP.findUnique({ where: { userId } }),
        prisma.bossBattle.count({ where: { userId, status: 'won' } }),
        prisma.performanceLog.findFirst({
          where: {
            userId,
            activityType: 'quiz',
            OR: [{ accuracy: { gte: 100 } }, { score: { gte: 100 } }],
          },
          select: { id: true },
        }),
        (prisma as any).userBadge.findMany({
          where: { userId },
          select: { badgeId: true, unlockedAt: true },
        }),
      ]);

    const badgeMap = new Map(existingUserBadges.map((badge) => [badge.badgeId, badge]));

    for (const badge of badges) {
      const shouldUnlock = (() => {
        switch (badge.key) {
          case 'first_steps':
            return (xpProfile?.totalXp ?? 0) > 0;
          case 'streak_5':
            return (xpProfile?.streakDays ?? 0) >= 5;
          case 'quiz_master':
            return Boolean(perfectQuiz);
          case 'boss_slayer':
            return bossWins >= 5;
          case 'xp_hunter':
            return (xpProfile?.totalXp ?? 0) >= 1000;
          default:
            return false;
        }
      })();

      if (shouldUnlock && !badgeMap.has(badge.id)) {
        const created = await (prisma as any).userBadge.create({
          data: {
            userId,
            badgeId: badge.id,
          },
          select: { badgeId: true, unlockedAt: true },
        });
        badgeMap.set(badge.id, created);
      }
    }

    return badges.map((badge: any) => ({
      id: badge.id,
      key: badge.key,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      unlocked: badgeMap.has(badge.id),
      unlockedAt: badgeMap.get(badge.id)?.unlockedAt ?? null,
    }));
    } catch (error: any) {
      console.error('[Gamification] getBadges error:', error.message);
      // Return default locked badges on error
      return DEFAULT_BADGES.map((badge) => ({
        id: badge.key,
        key: badge.key,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        unlocked: false,
        unlockedAt: null,
      }));
    }
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
