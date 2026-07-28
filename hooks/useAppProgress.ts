import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  PRACTICE_MODULE_TYPES,
  PRACTICE_UNLOCK_RULES,
  PracticeLevel,
} from "../utils/constants";

export type DifficultyLevel = "beginner" | "intermediate" | "advanced" | "expert";
export type FeatureStep = "LESSON_PRACTICE" | "READ_ALOUD" | "PHONICS" | "COMPLETED";

interface PracticeProgressRecord {
  current_question: number;
  completed: boolean;
  score: number;
}

const DEFAULT_PROGRESS: PracticeProgressRecord = {
  current_question: 1,
  completed: false,
  score: 0,
};

// Composite key so the SAME module name (e.g. "Letter Recognition") tracks
// SEPARATE progress per difficulty level (beginner / intermediate / advanced).
// Without this, Beginner "Read Aloud" progress and Advanced "Read Aloud"
// progress would overwrite each other in local state.
const makeProgressKey = (level: string, practiceType: string) =>
  `${level}::${practiceType}`;

// Maps "<level>::<practice_type>" -> progress details
type PracticeProgressMap = Record<string, PracticeProgressRecord>;

export function useAppProgress() {
  // Stores completed status of lessons fetched from Supabase lesson_completions
  const [lessonCompletions, setLessonCompletions] = useState<
    Array<{ level_key: string; lesson_key: string; completed: boolean }>
  >([]);
  const [practiceProgress, setPracticeProgress] = useState<PracticeProgressMap>({});
  const [currentLevel, setCurrentLevel] = useState<DifficultyLevel>("beginner");
  const [currentFeatureStep, setCurrentFeatureStep] = useState<FeatureStep>("LESSON_PRACTICE");
  const [loading, setLoading] = useState(true);

  const userIdRef = useRef<string | null>(null);

  /**
   * Pulls authoritative lesson completions directly from Supabase `lesson_completions`
   */
  const fetchLessonCompletions = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      userIdRef.current = user.id;

      const { data, error } = await supabase
        .from('lesson_completions')
        .select('level_key, lesson_key, completed')
        .eq('user_id', user.id)
        .eq('completed', true);

      if (error) throw error;
      setLessonCompletions(data || []);
    } catch (err) {
      console.warn("Could not fetch lesson completions from Supabase:", err);
    }
  }, []);

  /**
   * Fetches practice progress from the `practice_progress` table for the user.
   * Each row is keyed locally by "<level>::<practice_type>" so Beginner /
   * Intermediate / Advanced never share or overwrite each other's progress.
   */
  const fetchPracticeProgress = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('practice_progress')
        .select('level, practice_type, current_question, completed, score')
        .eq('user_id', userId);

      if (error) throw error;

      const progressMap: PracticeProgressMap = {};
      data?.forEach((row) => {
        progressMap[makeProgressKey(row.level, row.practice_type)] = {
          current_question: row.current_question,
          completed: row.completed,
          score: row.score,
        };
      });
      setPracticeProgress(progressMap);
    } catch (err) {
      console.warn("Could not fetch practice progress:", err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        userIdRef.current = user.id;
        await Promise.all([
          fetchLessonCompletions(),
          fetchPracticeProgress(user.id),
        ]);
      }
      setLoading(false);
    };
    init();
  }, [fetchLessonCompletions, fetchPracticeProgress]);

  /** Is a given Learn level ("level1".."level5") completed for this user? */
  const isLearnLevelComplete = useCallback(
    (levelKey: string): boolean =>
      lessonCompletions.some((item) => item.level_key === levelKey),
    [lessonCompletions]
  );

  /**
   * Look up saved progress for ONE specific module inside ONE specific
   * Practice level. This is the function screens should use to resume
   * "exactly where the user stopped" — never index practiceProgress by
   * practice_type alone, or Beginner/Intermediate/Advanced will collide.
   */
  const getPracticeProgress = useCallback(
    (level: string, practiceType: string): PracticeProgressRecord => {
      return practiceProgress[makeProgressKey(level, practiceType)] || DEFAULT_PROGRESS;
    },
    [practiceProgress]
  );

  /**
   * Sum of finished questions across all 4 modules of a given Practice level.
   * Used to drive the per-level progress bar (e.g. "12/20").
   */
  const getLevelCompletedCount = useCallback(
    (level: string): number => {
      return PRACTICE_MODULE_TYPES.reduce((sum, practiceType) => {
        const rec = practiceProgress[makeProgressKey(level, practiceType)];
        if (!rec) return sum;
        return sum + Math.max((rec.current_question || 1) - 1, 0);
      }, 0);
    },
    [practiceProgress]
  );

  /**
   * Are ALL 4 modules (Letter Recognition, Simple Words, Phonics Basics,
   * Read Aloud) of a Practice level marked completed? This is what gates
   * Advanced Practice ("Beginner Practice fully completed").
   */
  const isPracticeLevelFullyComplete = useCallback(
    (level: PracticeLevel): boolean => {
      return PRACTICE_MODULE_TYPES.every((practiceType) => {
        const rec = practiceProgress[makeProgressKey(level, practiceType)];
        return !!rec?.completed;
      });
    },
    [practiceProgress]
  );

  /**
   * Is the given Practice difficulty unlocked?
   * - beginner:     Lesson 1 + Lesson 2 completed
   * - intermediate: Lesson 2 + Lesson 3 completed
   * - advanced:     Beginner Practice fully completed AND Lesson 4 + Lesson 5 completed
   */
  const isUnlocked = useCallback(
    (level: string): boolean => {
      const rule = PRACTICE_UNLOCK_RULES[level as PracticeLevel];
      if (!rule) return false;

      const learnRequirementsMet = rule.requiredLearnLevels.every((reqKey) =>
        lessonCompletions.some(
          (item) => item.level_key === reqKey || item.lesson_key === reqKey
        )
      );
      if (!learnRequirementsMet) return false;

      if (rule.requiresPracticeLevelCompleted) {
        if (!isPracticeLevelFullyComplete(rule.requiresPracticeLevelCompleted)) {
          return false;
        }
      }

      return true;
    },
    [lessonCompletions, isPracticeLevelFullyComplete]
  );

  /** Human-readable reason a Practice level is still locked. */
  const getLockMessage = useCallback((level: string): string => {
    const rule = PRACTICE_UNLOCK_RULES[level as PracticeLevel];
    return rule?.lockedMessage ?? "Complete the required Learn levels to unlock this.";
  }, []);

  /**
   * Upserts practice progress into Supabase and updates local state.
   * `level` + `practiceType` together decide WHICH independent progress
   * slot gets written, so calling this for ("beginner","Read Aloud")
   * never touches ("intermediate","Read Aloud").
   */
  const updatePracticeProgress = async (
    levelName: string,
    practiceType: string,
    currentQuestion: number,
    completed: boolean = false,
    score: number = 0
  ) => {
    if (!userIdRef.current) return;

    try {
      const { error } = await supabase
        .from('practice_progress')
        .upsert(
          {
            user_id: userIdRef.current,
            level: levelName,
            practice_type: practiceType,
            current_question: currentQuestion,
            completed: completed,
            score: score,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,level,practice_type' }
        );

      if (error) throw error;

      setPracticeProgress((prev) => ({
        ...prev,
        [makeProgressKey(levelName, practiceType)]: {
          current_question: currentQuestion,
          completed,
          score,
        },
      }));
    } catch (err) {
      console.error("Failed to update practice progress:", err);
    }
  };

  return {
    currentLevel,
    setCurrentLevel,
    lessonCompletions,
    currentFeatureStep,
    setCurrentFeatureStep,
    isUnlocked,
    isLearnGatePassed: isUnlocked,
    getLockMessage,
    isLearnLevelComplete,
    practiceProgress,
    getPracticeProgress,
    getLevelCompletedCount,
    isPracticeLevelFullyComplete,
    updatePracticeProgress,
    refreshProgress: fetchLessonCompletions,
    loading,
  };
}