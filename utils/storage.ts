import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  LEARN_COMPLETION: '@zyralex_learn_completion', // Stores { level1: boolean, ... }
  PRACTICE_PROGRESS: '@zyralex_practice_progress', // Stores { beginner: { completed: number, lastIndex: number }, ... }
};

export const saveLearnStatus = async (levels: Record<string, boolean>) => {
  await AsyncStorage.setItem(STORAGE_KEYS.LEARN_COMPLETION, JSON.stringify(levels));
};

export const getLearnStatus = async (): Promise<Record<string, boolean>> => {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.LEARN_COMPLETION);
  return data ? JSON.parse(data) : { level1: false, level2: false, level3: false, level4: false, level5: false };
};

export const savePracticeProgress = async (level: string, completed: number, lastIndex: number) => {
  const existing = await getPracticeProgress();
  await AsyncStorage.setItem(STORAGE_KEYS.PRACTICE_PROGRESS, JSON.stringify({
    ...existing,
    [level]: { completed, lastIndex }
  }));
};

export const getPracticeProgress = async () => {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.PRACTICE_PROGRESS);
  return data ? JSON.parse(data) : { beginner: { completed: 0, lastIndex: 0 }, intermediate: { completed: 0, lastIndex: 0 }, advanced: { completed: 0, lastIndex: 0 } };
};