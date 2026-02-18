export interface StudentXP {
    id: string;
    userId: string;
    totalXp: number;
    level: number;
    streakDays: number;
    lastActivityDate: Date;
}
export interface XPLog {
    id: string;
    userId: string;
    source: XPSource;
    xpAmount: number;
    createdAt: Date;
}
export interface BossBattle {
    id: string;
    userId: string;
    topicId: string;
    bossHp: number;
    playerHp: number;
    status: BattleStatus;
    startedAt: Date;
    endedAt?: Date;
}
export interface FlashcardProgress {
    id: string;
    userId: string;
    topicId: string;
    cardText: string;
    known: boolean;
    repetitionCount: number;
    lastReviewed: Date;
}
export interface SpinReward {
    id: string;
    userId: string;
    rewardType: RewardType;
    rewardValue: string;
    createdAt: Date;
}
export declare enum XPSource {
    QUIZ = "quiz",
    BOSS_BATTLE = "boss_battle",
    FLASHCARD = "flashcard",
    PRACTICE = "practice",
    SPIN_WHEEL = "spin_wheel",
    STREAK = "streak"
}
export declare enum BattleStatus {
    ACTIVE = "active",
    WON = "won",
    LOST = "lost"
}
export declare enum RewardType {
    XP_BOOST = "xp_boost",
    HINT_TOKEN = "hint_token",
    BONUS_QUIZ = "bonus_quiz",
    STREAK_BONUS = "streak_bonus"
}
export interface BossBattleState {
    battleId: string;
    bossName: string;
    bossHp: number;
    bossMaxHp: number;
    playerHp: number;
    playerMaxHp: number;
    currentQuestion: BattleQuestion | null;
    status: BattleStatus;
    xpReward: number;
}
export interface BattleQuestion {
    id: string;
    questionText: string;
    options: [string, string, string, string];
    timeLimit: number;
}
export interface SprintQuizState {
    questionIndex: number;
    totalQuestions: number;
    currentQuestion: SprintQuestion | null;
    score: number;
    timeRemaining: number;
    isComplete: boolean;
}
export interface SprintQuestion {
    id: string;
    questionText: string;
    options: [string, string, string, string];
    correctOption: string;
}
//# sourceMappingURL=gamification.d.ts.map