import { AIMode } from '../types/api';
export declare const AI_MODES: {
    readonly LEARNING: AIMode.LEARNING;
    readonly ASSESSMENT: AIMode.ASSESSMENT;
    readonly PRACTICE: AIMode.PRACTICE;
};
export declare const MODE_LABELS: Record<AIMode, string>;
export declare const MODE_CONFIG: {
    readonly learning: {
        readonly allowDirectAnswers: true;
        readonly allowStepByStep: true;
        readonly allowHints: true;
        readonly maxResponseTokens: 1024;
    };
    readonly assessment: {
        readonly allowDirectAnswers: false;
        readonly allowStepByStep: false;
        readonly allowHints: true;
        readonly maxResponseTokens: 256;
    };
    readonly practice: {
        readonly allowDirectAnswers: false;
        readonly allowStepByStep: true;
        readonly allowHints: true;
        readonly maxResponseTokens: 512;
    };
};
//# sourceMappingURL=modes.d.ts.map