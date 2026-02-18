"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODE_CONFIG = exports.MODE_LABELS = exports.AI_MODES = void 0;
const api_1 = require("../types/api");
exports.AI_MODES = {
    LEARNING: api_1.AIMode.LEARNING,
    ASSESSMENT: api_1.AIMode.ASSESSMENT,
    PRACTICE: api_1.AIMode.PRACTICE,
};
exports.MODE_LABELS = {
    [api_1.AIMode.LEARNING]: 'Learning',
    [api_1.AIMode.ASSESSMENT]: 'Assessment',
    [api_1.AIMode.PRACTICE]: 'Practice',
};
// AI behavior per mode
exports.MODE_CONFIG = {
    [api_1.AIMode.LEARNING]: {
        allowDirectAnswers: true,
        allowStepByStep: true,
        allowHints: true,
        maxResponseTokens: 1024,
    },
    [api_1.AIMode.ASSESSMENT]: {
        allowDirectAnswers: false,
        allowStepByStep: false,
        allowHints: true,
        maxResponseTokens: 256,
    },
    [api_1.AIMode.PRACTICE]: {
        allowDirectAnswers: false,
        allowStepByStep: true,
        allowHints: true,
        maxResponseTokens: 512,
    },
};
//# sourceMappingURL=modes.js.map