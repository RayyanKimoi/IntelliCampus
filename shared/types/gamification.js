"use strict";
// ========================
// Gamification Types
// ========================
Object.defineProperty(exports, "__esModule", { value: true });
exports.RewardType = exports.BattleStatus = exports.XPSource = void 0;
var XPSource;
(function (XPSource) {
    XPSource["QUIZ"] = "quiz";
    XPSource["BOSS_BATTLE"] = "boss_battle";
    XPSource["FLASHCARD"] = "flashcard";
    XPSource["PRACTICE"] = "practice";
    XPSource["SPIN_WHEEL"] = "spin_wheel";
    XPSource["STREAK"] = "streak";
})(XPSource || (exports.XPSource = XPSource = {}));
var BattleStatus;
(function (BattleStatus) {
    BattleStatus["ACTIVE"] = "active";
    BattleStatus["WON"] = "won";
    BattleStatus["LOST"] = "lost";
})(BattleStatus || (exports.BattleStatus = BattleStatus = {}));
var RewardType;
(function (RewardType) {
    RewardType["XP_BOOST"] = "xp_boost";
    RewardType["HINT_TOKEN"] = "hint_token";
    RewardType["BONUS_QUIZ"] = "bonus_quiz";
    RewardType["STREAK_BONUS"] = "streak_bonus";
})(RewardType || (exports.RewardType = RewardType = {}));
//# sourceMappingURL=gamification.js.map