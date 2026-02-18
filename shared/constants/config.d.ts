export declare const APP_CONFIG: {
    readonly name: "IntelliCampus";
    readonly version: "0.1.0";
    readonly description: "Governed AI Academic Intelligence Platform";
};
export declare const MASTERY: {
    readonly MIN_SCORE: 0;
    readonly MAX_SCORE: 100;
    readonly WEAK_THRESHOLD: 40;
    readonly MODERATE_THRESHOLD: 70;
    readonly STRONG_THRESHOLD: 90;
};
export declare const GAMIFICATION: {
    readonly XP_PER_CORRECT_ANSWER: 10;
    readonly XP_PER_QUIZ_COMPLETE: 50;
    readonly XP_PER_BOSS_BATTLE_WIN: 100;
    readonly XP_PER_FLASHCARD_REVIEW: 5;
    readonly XP_PER_STREAK_DAY: 25;
    readonly XP_PER_SPIN: 15;
    readonly BOSS_DEFAULT_HP: 100;
    readonly PLAYER_DEFAULT_HP: 100;
    readonly BOSS_DAMAGE_PER_CORRECT: 20;
    readonly PLAYER_DAMAGE_PER_WRONG: 25;
    readonly SPRINT_QUIZ_TIME_SECONDS: 45;
    readonly SPRINT_QUIZ_QUESTIONS: 10;
    readonly LEVEL_XP_MULTIPLIER: 100;
};
export declare const PAGINATION: {
    readonly DEFAULT_PAGE: 1;
    readonly DEFAULT_LIMIT: 20;
    readonly MAX_LIMIT: 100;
};
export declare const UPLOAD: {
    readonly MAX_FILE_SIZE_MB: 50;
    readonly ALLOWED_TYPES: readonly ["application/pdf", "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    readonly ALLOWED_EXTENSIONS: readonly [".pdf", ".txt", ".doc", ".docx"];
};
export declare const RAG: {
    readonly CHUNK_SIZE: 1000;
    readonly CHUNK_OVERLAP: 200;
    readonly TOP_K_RESULTS: 5;
    readonly MIN_RELEVANCE_SCORE: 0.7;
};
//# sourceMappingURL=config.d.ts.map