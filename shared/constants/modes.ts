import { AIMode } from '../types/api';

export const AI_MODES = {
  LEARNING: AIMode.LEARNING,
  ASSESSMENT: AIMode.ASSESSMENT,
  PRACTICE: AIMode.PRACTICE,
} as const;

export const MODE_LABELS: Record<AIMode, string> = {
  [AIMode.LEARNING]: 'Learning',
  [AIMode.ASSESSMENT]: 'Assessment',
  [AIMode.PRACTICE]: 'Practice',
};

// AI behavior per mode
export const MODE_CONFIG = {
  [AIMode.LEARNING]: {
    allowDirectAnswers: true,
    allowStepByStep: true,
    allowHints: true,
    maxResponseTokens: 1024,
  },
  [AIMode.ASSESSMENT]: {
    allowDirectAnswers: false,
    allowStepByStep: false,
    allowHints: true,
    maxResponseTokens: 256,
  },
  [AIMode.PRACTICE]: {
    allowDirectAnswers: false,
    allowStepByStep: true,
    allowHints: true,
    maxResponseTokens: 512,
  },
} as const;
