// utils/constants.ts
// Single source of truth for how Practice levels map to required Learn levels.
// Both useAppProgress (unlock logic) and practice.tsx (UI messages) read this
// instead of hardcoding the rule twice.

export type PracticeLevel = "beginner" | "intermediate" | "advanced";

export const LEARN_LEVEL_KEYS = [
  "level1",
  "level2",
  "level3",
  "level4",
  "level5",
] as const;

export type LearnLevelKey = (typeof LEARN_LEVEL_KEYS)[number];

interface PracticeUnlockRule {
  requiredLearnLevels: LearnLevelKey[];
  lockedMessage: string;
}

export const PRACTICE_UNLOCK_RULES: Record<PracticeLevel, PracticeUnlockRule> = {
  beginner: {
    requiredLearnLevels: ["level1", "level2"],
    lockedMessage: "Complete Learn Levels 1 and 2 to unlock Beginner.",
  },
  intermediate: {
    requiredLearnLevels: ["level3", "level4"],
    lockedMessage: "Complete Learn Levels 3 and 4 to unlock Intermediate.",
  },
  advanced: {
    requiredLearnLevels: ["level5"],
    lockedMessage: "Complete Learn Level 5 to unlock Advanced.",
  },
};