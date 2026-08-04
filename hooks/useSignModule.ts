// hooks/useSignModule.ts
import { fetchSignModule, type UserStats } from '@/lib/queries/signModule';
import { supabase } from '@/lib/supabase';
import type { Lesson, Level } from '@/types/lesson';
import { useCallback, useEffect, useState } from 'react';

const EMPTY_STATS: UserStats = {
  dayStreak: 0, totalXp: 0, avgAccuracy: 0,
  currentLevelId: null, currentLessonId: null,
};

export function useSignModule() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [lessonMap, setLessonMap] = useState<Record<string, Lesson>>({});
  const [stats, setStats] = useState<UserStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const result = await fetchSignModule(session?.user?.id);
      setLevels(result.levels);
      setLessonMap(result.lessonMap);
      setStats(result.stats);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load sign module data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Re-run whenever auth state actually changes (e.g. session attaches
    // a beat after signUp, or token refreshes) so a stale/empty first
    // fetch gets corrected automatically.
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load();
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  return { levels, lessonMap, stats, loading, error, refetch: load };
}