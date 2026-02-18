"use strict";
// ========================
// Mastery & Analytics Types
// ========================
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractionType = exports.ActivityType = void 0;
var ActivityType;
(function (ActivityType) {
    ActivityType["QUIZ"] = "quiz";
    ActivityType["ASSIGNMENT"] = "assignment";
    ActivityType["BOSS_BATTLE"] = "boss_battle";
    ActivityType["FLASHCARD"] = "flashcard";
    ActivityType["PRACTICE"] = "practice";
    ActivityType["AI_LEARNING"] = "ai_learning";
})(ActivityType || (exports.ActivityType = ActivityType = {}));
var InteractionType;
(function (InteractionType) {
    InteractionType["DOUBT"] = "doubt";
    InteractionType["QUIZ"] = "quiz";
    InteractionType["FLASHCARD"] = "flashcard";
    InteractionType["BOSS_BATTLE"] = "boss_battle";
})(InteractionType || (exports.InteractionType = InteractionType = {}));
//# sourceMappingURL=mastery.js.map