import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { LEARN_LEVEL_KEYS, PRACTICE_UNLOCK_RULES, PracticeLevel } from "../utils/constants";
import { getCurrentProgress } from "../utils/progress";
import {
  getLearnStatus,
  getPracticeProgress,
  saveLearnStatus,
  savePracticeProgress,
} from "../utils/storage";

export type DifficultyLevel = "beginner" | "intermediate" | "advanced" | "expert";
export type FeatureStep = "LESSON_PRACTICE" | "READ_ALOUD" | "PHONICS" | "COMPLETED";

interface LevelProgress {
  completed: number;
  lastIndex: number;
}
type PracticeProgressMap = Record<string, LevelProgress>;

export function useAppProgress() {
  const [learnStatus, setLearnStatus] = useState<Record<string, boolean>>({});
  const [practiceProgress, setPracticeProgress] = useState<PracticeProgressMap>({});
  const [currentLevel, setCurrentLevel] = useState<DifficultyLevel>("beginner");
  const [currentFeatureStep, setCurrentFeatureStep] = useState<FeatureStep>("LESSON_PRACTICE");
  const [loading, setLoading] = useState(true);

  const userIdRef = useRef<string | null>(null);

  /**
   * Pulls the authoritative `completed_levels` array from Supabase
   * (written elsewhere by the Learn/lesson screens via markLevelCompleted)
   * and mirrors it into the local AsyncStorage learnStatus record that
   * Practice unlocking reads. Supabase stays the source of truth; this
   * just keeps a fast local copy in sync.
   */
  const syncLearnStatusFromSupabase = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      userIdRef.current = user.id;

      const progress = await getCurrentProgress(user.id);
      const completedLevels: string[] = (progress as any)?.completed_levels ?? [];

      const nextStatus: Record<string, boolean> = {};
      LEARN_LEVEL_KEYS.forEach((key) => {
        nextStatus[key] = completedLevels.includes(key);
      });

      await saveLearnStatus(nextStatus);
      setLearnStatus(nextStatus);
    } catch (err) {
      // Non-fatal — keep whatever was already cached locally.
      console.warn("Could not sync learn status from Supabase:", err);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      const [lStatus, pProgress] = await Promise.all([
        getLearnStatus(),
        getPracticeProgress(),
      ]);
      setLearnStatus(lStatus);
      setPracticeProgress(pProgress);
      setLoading(false);

      // Refresh from Supabase in the background after showing cached data.
      syncLearnStatusFromSupabase();
    };
    load();
  }, [syncLearnStatusFromSupabase]);

  /** Is the given Practice difficulty unlocked, based on Learn completion? */
  const isUnlocked = useCallback(
    (level: string): boolean => {
      const rule = PRACTICE_UNLOCK_RULES[level as PracticeLevel];
      if (!rule) return false;
      return rule.requiredLearnLevels.every((key) => !!learnStatus[key]);
    },
    [learnStatus]
  );

  /** Human-readable reason a Practice level is still locked. */
  const getLockMessage = useCallback((level: string): string => {
    const rule = PRACTICE_UNLOCK_RULES[level as PracticeLevel];
    return rule?.lockedMessage ?? "Complete the required Learn levels to unlock this.";
  }, []);

  const updatePracticeProgress = async (level: string, count: number, index: number) => {
    await savePracticeProgress(level, count, index);
    setPracticeProgress((prev) => ({
      ...prev,
      [level]: { completed: count, lastIndex: index },
    }));
  };

  /**
   * Called whenever the user successfully completes one Practice activity
   * (a mini-game, or a Read Aloud sentence). Bumps the completed count for
   * the currently active level and advances the resume index.
   */
  const advanceToNextFeature = useCallback(
    async (indexOverride?: number) => {
      const existing = practiceProgress[currentLevel] || { completed: 0, lastIndex: 0 };
      const nextCompleted = existing.completed + 1;
      const nextIndex = indexOverride ?? existing.lastIndex + 1;
      await updatePracticeProgress(currentLevel, nextCompleted, nextIndex);
    },
    [currentLevel, practiceProgress]
  );

  /**
   * DEBUG / TESTING ONLY — wired to the "Clear Gate" button in practice.tsx.
   * Force-unlocks a Practice level by flipping its required Learn levels to
   * true LOCALLY ONLY. It never writes to Supabase. Remove the debug button
   * before you ship.
   */
  const debugCompleteLearnModule = useCallback(
    async (level: string) => {
      const rule = PRACTICE_UNLOCK_RULES[level as PracticeLevel];
      if (!rule) return;

      const nextStatus = { ...learnStatus };
      rule.requiredLearnLevels.forEach((key) => {
        nextStatus[key] = true;
      });

      await saveLearnStatus(nextStatus);
      setLearnStatus(nextStatus);
    },
    [learnStatus]
  );

  return {
    currentLevel,
    setCurrentLevel,
    learnStatus,
    currentFeatureStep,
    setCurrentFeatureStep,
    isUnlocked,
    isLearnGatePassed: isUnlocked,
    getLockMessage,
    // Progress for the currently active level (kept for existing callers)
    practiceProgress: practiceProgress[currentLevel] || { completed: 0, lastIndex: 0 },
    // Full map so the UI can render all three cards' progress at once
    allPracticeProgress: practiceProgress,
    wordsCompletedCount: practiceProgress[currentLevel]?.completed || 0,
    updatePracticeProgress,
    advanceToNextFeature,
    debugCompleteLearnModule,
    refreshLearnStatus: syncLearnStatusFromSupabase,
    loading,
  };
}