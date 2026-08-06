// lib/queries/signModule.ts

import { supabase } from '@/lib/supabase';
import type { Lesson, Level, SignItem } from '@/types/lesson';

const MODULE = 'sign' as const;

export type UserStats = {
  dayStreak: number;
  totalXp: number;     // total xp
  avgAccuracy: number; // average of lessonwise accuracy 
  currentLevelId: string | null;  //'level-1'
  currentLessonId: string | null; // 'lesson-3'
};

const EMPTY_STATS: UserStats = {
  dayStreak: 0,
  totalXp: 0,
  avgAccuracy: 0,
  currentLevelId: null,
  currentLessonId: null,
};

// one row per (user, lesson)
type LessonCompletionRow = {
  lesson_id: string;       // uuid, matches lessons.id
  level_number: number;
  lesson_number: number;
  unlocked: boolean | null;
  completed: boolean | null;
  score: number | null;
  earned_xp: number | null;
  accuracy: number | null; // this lesson's own accuracy
  completed_at: string | null;
};

// single row per user 
type UserProgressRow = {
  current_level: string | null;
  current_lesson: string | null;
  current_streak: number | null;
  total_xp: number | null;
  avg_accuracy:number | null;
  updated_at: string | null;
};

//fetch the sign module
export async function fetchSignModule(userId?: string): Promise<{
  levels: Level[];
  lessonMap: Record<string, Lesson>;
  stats: UserStats;
}> {
  const [levelRows, lessonRows, completions, progressRow] = await Promise.all([
    fetchLevels(),
    fetchLessons(),
    userId ? fetchCompletions(userId) : Promise.resolve<LessonCompletionRow[]>([]),
    userId ? fetchProgress(userId) : Promise.resolve<UserProgressRow | null>(null),
  ]);

  if (!levelRows.length) {
    return { levels: [], lessonMap: {}, stats: EMPTY_STATS };
  }

  const lessonIds = lessonRows.map((l) => l.id);
  const signRows = lessonIds.length ? await fetchSigns(lessonIds) : [];

  const levels = assembleLevels(levelRows, lessonRows, signRows, completions);
  const lessonMap = buildLessonMap(levels);

  // avgAccuracy from sign_user_progress
  const stats = computeStats(progressRow);

  return { levels, lessonMap, stats };
}

//internal fetch helpers 
async function fetchLevels() {
  const { data: { session } } = await supabase.auth.getSession();
  console.log('[fetchLevels] session role:', session ? 'authenticated' : 'anon (no session)');
  const { data, error, status, statusText } = await supabase
    .from('levels')
    .select('id, level_name, level_number')
    .eq('module', MODULE)
    .order('level_number', { ascending: true });
  console.log('[fetchLevels] status:', status, statusText, 'rows:', data?.length, 'error:', error);
  if (error) throw error;
  return data ?? [];
}

async function fetchLessons() {
  const { data, error, status, statusText } = await supabase
    .from('lessons')
    .select(
      `id, lesson_title, level_id,
       sign_lesson_details ( xp, description,practice_description, level_number, lesson_number, lesson_title )`
    )
    .eq('module', MODULE);
  console.log('[fetchLessons] status:', status, statusText, 'rows:', data?.length, 'error:', error);
  if (data?.length) {
    console.log('[fetchLessons] sample row:', JSON.stringify(data[0]));
  }
  if (error) throw error;
  return data ?? [];
}

async function fetchSigns(lessonIds: string[]) {
  const { data, error, status, statusText } = await supabase
    .from('lesson_signs')
    .select('id, lesson_id, sign_id, label, image_url, video_url, hint, gesture_key, sort_order')
    .in('lesson_id', lessonIds)
    .order('sort_order', { ascending: true });
  console.log('[fetchSigns] status:', status, statusText, 'rows:', data?.length, 'error:', error);
  if (error) throw error;
  return data ?? [];
}

async function fetchCompletions(userId: string): Promise<LessonCompletionRow[]> {
  const { data, error } = await supabase
    .from('sign_lesson_completion')
    .select('lesson_id, level_number, lesson_number, unlocked, completed, score, earned_xp, accuracy, completed_at')
    .eq('user_id', userId)
    .order('completed_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function fetchProgress(userId: string): Promise<UserProgressRow | null> {
  const { data, error } = await supabase
    .from('sign_user_progress')
    .select('current_level, current_lesson, current_streak, total_xp,avg_accuracy, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

//internal assembly helpers 
function assembleLevels(
  levelRows: Awaited<ReturnType<typeof fetchLevels>>,
  lessonRows: Awaited<ReturnType<typeof fetchLessons>>,
  signRows: Awaited<ReturnType<typeof fetchSigns>>,
  completions: LessonCompletionRow[],
): Level[] {
  const isCompleted = (levelNumber: number, lessonNumber: number) =>
    completions.some(
      (c) => c.level_number === levelNumber && c.lesson_number === lessonNumber && c.completed
    );

  const earnedXpFor = (lessonUuid: string) =>
    completions.find((c) => c.lesson_id === lessonUuid)?.earned_xp ?? 0;

  // This lesson's own accuracy
  const accuracyFor = (lessonUuid: string): number | null =>
    completions.find((c) => c.lesson_id === lessonUuid)?.accuracy ?? null;

  return levelRows.map((lvl) => {
    const levelId = `level-${lvl.level_number}`;

    const lessonsForLevel = lessonRows
      .filter((l) => l.level_id === lvl.id)
      .map((l) => {
        // sign_lesson_details is returned as an array by supabase-js
        const details = Array.isArray(l.sign_lesson_details)
          ? l.sign_lesson_details[0]
          : l.sign_lesson_details;

        const lessonNumber = details?.lesson_number ?? 0;
        const lessonId = `lesson-${lessonNumber}`;

        const signs: SignItem[] = signRows
          .filter((s) => s.lesson_id === l.id)
          .map((s) => ({
            signId: s.sign_id,
            label: s.label,
            image: s.image_url,
            video: s.video_url,
            hint: s.hint ?? '',
            gestureKey: s.gesture_key ?? '',
          }));

        const lesson: Lesson = {
          lessonId,
          lessonUuid: l.id,
          title: details?.lesson_title ?? l.lesson_title,
          description: details?.description ?? '',
          descriptionpractice: details?.practice_description ?? '',
          xp: details?.xp ?? 0,
          earnedXp: earnedXpFor(l.id),
          completed: isCompleted(lvl.level_number, lessonNumber),
          accuracy: accuracyFor(l.id),
          signs,
        };
        return { lesson, lessonNumber };
      })
      .sort((a, b) => a.lessonNumber - b.lessonNumber)
      .map((x) => x.lesson);

    const completedCount = lessonsForLevel.filter((l) => l.completed).length;

    return {
      levelId,
      title: lvl.level_name,
      level: lvl.level_number,
      completed: completedCount,
      total: lessonsForLevel.length,
      lessons: lessonsForLevel,
    };
  });
}

function buildLessonMap(levels: Level[]): Record<string, Lesson> {
  const map: Record<string, Lesson> = {};
  levels.forEach((level) => {
    level.lessons.forEach((lesson) => {
      map[`${level.levelId}_${lesson.lessonId}`] = lesson;
    });
  });
  return map;
}

function computeStats(progress: UserProgressRow | null): UserStats {
  return {
    dayStreak: progress?.current_streak ?? 0,
    totalXp: progress?.total_xp ?? 0,
    avgAccuracy: progress?.avg_accuracy ?? 0,
    currentLevelId: progress?.current_level ?? null,
    currentLessonId: progress?.current_lesson ?? null,
  };
}

//Recomputes avg_accuracy
async function recalculateAvgAccuracy(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('sign_lesson_completion')
    .select('accuracy')
    .eq('user_id', userId)
    .eq('completed', true)
    .not('accuracy', 'is', null);
  if (error) throw error;
 
  const rows = data ?? [];
  const avgAccuracy = rows.length
    ? Math.round((rows.reduce((sum, r) => sum + (r.accuracy ?? 0), 0) / rows.length) * 100) / 100
    : 0;
 
  const { error: upsertErr } = await supabase.from('sign_user_progress').upsert(
    { user_id: userId, avg_accuracy: avgAccuracy },
    { onConflict: 'user_id' }
  );
  if (upsertErr) throw upsertErr;
}
 

function localDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

//`scorePct` is 0-100.
export async function recordLessonCompletion(params: {
  userId: string;
  lessonUuid: string;   // lessons.id (uuid)
  levelNumber: number;  // e.g. 1
  lessonNumber: number; // e.g. 3
  scorePct: number;     // 0-100
  totalXp: number;      // the lesson's total XP
}) {
  const { userId, lessonUuid, levelNumber, lessonNumber, scorePct, totalXp } = params;
  const earnedXp = Math.round((scorePct / 100) * totalXp);

  // Upsert the lesson's completion row 
  const { error: completionErr } = await supabase.from('sign_lesson_completion').upsert(
    {
      user_id: userId,
      lesson_id: lessonUuid,
      level_number: levelNumber,
      lesson_number: lessonNumber,
      unlocked: true,
      completed: true,
      score: Math.round(scorePct),
      earned_xp: earnedXp,
    },
    { onConflict: 'user_id,lesson_id' }
  );
  if (completionErr) throw completionErr;

  // Pull the user's current summary row to update the streak 
  const { data: existing, error: fetchErr } = await supabase
    .from('sign_user_progress')
    .select('current_streak, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (fetchErr) throw fetchErr;

  const today = localDateString(new Date());
  const lastActiveDay = existing?.updated_at ? localDateString(new Date(existing.updated_at)) : null;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = localDateString(yesterday);

  let newStreak: number;
  if (lastActiveDay === today) {
    newStreak = existing?.current_streak ?? 1;
  } else if (lastActiveDay === yesterdayStr) {
    newStreak = (existing?.current_streak ?? 0) + 1;
  } else {
    newStreak = 1;
  }

  // Recompute total_xp 
  const { data: allCompletions, error: sumErr } = await supabase
    .from('sign_lesson_completion')
    .select('earned_xp')
    .eq('user_id', userId);
  if (sumErr) throw sumErr;

  const newTotalXp = (allCompletions ?? []).reduce((sum, c) => sum + (c.earned_xp ?? 0), 0);

  const { error: progressErr } = await supabase.from('sign_user_progress').upsert(
    {
      user_id: userId,
      current_level: `level-${levelNumber}`,
      current_lesson: `lesson-${lessonNumber}`,
      current_streak: newStreak,
      total_xp: newTotalXp,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
  if (progressErr) throw progressErr;
  await recalculateAvgAccuracy(userId);
}

export async function recordPracticeAttempt(params: {
  userId: string;
  signId: string;      // the specific sign practiced 
  accuracy: number;     // 0-100 score returned by the recognition model
  lessonUuid: string;   // which lesson this sign belongs to
  levelNumber: number;  // needed in case sign_lesson_completion has no row yet
  lessonNumber: number;
}) {
  const { userId, signId, accuracy, lessonUuid, levelNumber, lessonNumber } = params;
  const roundedAccuracy = Math.round(accuracy * 100) / 100;

  // Upsert this sign's latest score 
  const { error: scoreErr } = await supabase.from('sign_practice_scores').upsert(
    {
      user_id: userId,
      lesson_id: lessonUuid,
      sign_id: signId,
      accuracy: roundedAccuracy,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,lesson_id,sign_id' }
  );
  if (scoreErr) throw scoreErr;

  // Pull every sign's latest score for this lesson
  const { data: signScores, error: scoresErr } = await supabase
    .from('sign_practice_scores')
    .select('accuracy')
    .eq('user_id', userId)
    .eq('lesson_id', lessonUuid);
  if (scoresErr) throw scoresErr;

  // Total signs that actually belong to this lesson 
  const { count: totalSignsInLesson, error: countErr } = await supabase
    .from('lesson_signs')
    .select('id', { count: 'exact', head: true })
    .eq('lesson_id', lessonUuid);
  if (countErr) throw countErr;

  const sumAccuracy = (signScores ?? []).reduce((sum, s) => sum + (s.accuracy ?? 0), 0);
  const denominator = totalSignsInLesson && totalSignsInLesson > 0
    ? totalSignsInLesson
    : Math.max(signScores?.length ?? 0, 1);

  const lessonAccuracy = Math.round((sumAccuracy / denominator) * 100) / 100;

  // lesson-level accuracy into sign_lesson_completion.accuracy.
  const { error: rollupErr } = await supabase.from('sign_lesson_completion').upsert(
    {
      user_id: userId,
      lesson_id: lessonUuid,
      level_number: levelNumber,
      lesson_number: lessonNumber,
      accuracy: lessonAccuracy,
    },
    { onConflict: 'user_id,lesson_id' }
  );
  if (rollupErr) throw rollupErr;
  await recalculateAvgAccuracy(userId);
}