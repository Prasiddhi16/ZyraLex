import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
export const weakAreaToLesson: Record<string, string> = {
  letter_reversal: "letter_reversal",
  spelling_recognition: "letter_reversal",
  visual_tracking: "visual_tracking",
  phonics: "phonics",
  phonological_awareness: "phonics",
  phoneme_manipulation: "phonics",
  vowel_processing: "vowel_processing",
  decoding: "decoding",
  chunking: "chunking",
};

export function getLessonKeyForWeakArea(weakArea?: string | null): string {
  if (!weakArea) return "letter_reversal";
  return weakAreaToLesson[weakArea.trim().toLowerCase()] ?? "letter_reversal";
}

export const LESSON_COUNTS_PER_LEVEL: Record<string, number> = {
  level1: 5,
  level2: 5,
  level3: 5,
  level4: 1,
  level5: 1,
};
export async function getLatestAssessment(userId: string) {
  const { data, error } = await supabase
    .from("assessments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}
export async function getCurrentProgress(userId: string) {
  const { data } = await supabase
    .from("dyslexic_user_progress") // <-- changed
    .select("current_level, current_lesson, completed_levels")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function saveCurrentProgress(
  userId: string,
  currentLevel: string,
  currentLesson: string,
) {
  await supabase.from("dyslexic_user_progress").upsert(
    {
      user_id: userId,
      current_level: currentLevel,
      current_lesson: currentLesson,
    },
    { onConflict: "user_id" },
  );
}
export async function markLevelCompleted(userId: string, level: string) {
  const { data } = await supabase
    .from("dyslexic_user_progress")
    .select("completed_levels")
    .eq("user_id", userId)
    .maybeSingle();

  const existing: string[] = data?.completed_levels ?? [];
  if (existing.includes(level)) return;

  await supabase
    .from("dyslexic_user_progress")
    .upsert(
      { user_id: userId, completed_levels: [...existing, level] },
      { onConflict: "user_id" },
    );
}

export async function upsertLessonProgress(params: {
  userId: string;
  levelKey: string;
  lessonKey: string;
  completed: boolean;
  score: number;
}) {
  const { error } = await supabase.from("lesson_completions").upsert(
    {
      user_id: params.userId,
      level_key: params.levelKey,
      lesson_key: params.lessonKey,
      completed: params.completed,
      score: params.score,
    },
    { onConflict: "user_id,level_key,lesson_key" },
  );
  if (error) throw error;
}

export type LearnDestination =
  | { kind: "assessment" }
  | { kind: "lesson"; level: string; lesson: string };

export async function getLearnEntryRoute(
  userId: string,
): Promise<LearnDestination> {
  const assessment = await getLatestAssessment(userId);

  if (!assessment) {
    return { kind: "assessment" };
  }

  const progress = await getCurrentProgress(userId);

  if (progress?.current_level && progress?.current_lesson) {
    return {
      kind: "lesson",
      level: progress.current_level,
      lesson: progress.current_lesson,
    };
  }

  return {
    kind: "lesson",
    level: assessment.level ?? "level1",
    lesson: assessment.weak_area ?? "letter_reversal",
  };
}

// ... keep all your existing exports (getLatestAssessment, saveCurrentProgress, etc.) ...

/**
 * Tracks and accumulates active learning time for the dyslexia module.
 * Saved to AsyncStorage under 'learning_time_dyslexic' for dashboard analytics.
 */
export async function trackDyslexiaTime(secondsSpent: number) {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const todayKey = `${year}-${month}-${day}`;

    const stored = await AsyncStorage.getItem("learning_time_dyslexic");
    const data: Record<string, number> = stored ? JSON.parse(stored) : {};

    // Accumulate the seconds for today
    data[todayKey] = (data[todayKey] || 0) + secondsSpent;

    await AsyncStorage.setItem("learning_time_dyslexic", JSON.stringify(data));
  } catch (error) {
    console.log("Failed to save dyslexia learning time:", error);
  }
}