import AsyncStorage from "@react-native-async-storage/async-storage";

export type LearningModule = "dyslexic" | "sign";

const STORAGE_KEYS = {
  dyslexic: "learning_time_dyslexic",
  sign: "learning_time_sign",
};

function getTodayKey() {
  const date = new Date();
  return date.toISOString().split("T")[0];
}

type DailyTime = Record<string, number>;

export async function addLearningTime(
  module: LearningModule,
  seconds: number
) {
  if (seconds <= 0) return;

  try {
    const key = STORAGE_KEYS[module];
    const stored = await AsyncStorage.getItem(key);

    const data: DailyTime = stored ? JSON.parse(stored) : {};
    const today = getTodayKey();

    data[today] = (data[today] || 0) + seconds;

    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving learning time:", error);
  }
}

export async function getLearningTime(
  module: LearningModule,
  date?: string
) {
  try {
    const key = STORAGE_KEYS[module];
    const stored = await AsyncStorage.getItem(key);

    if (!stored) return 0;

    const data: DailyTime = JSON.parse(stored);
    const targetDate = date || getTodayKey();

    return data[targetDate] || 0;
  } catch (error) {
    console.error("Error getting learning time:", error);
    return 0;
  }
}

export async function getWeeklyLearningTime(
  module: LearningModule
): Promise<Record<string, number>> {
  try {
    const key = STORAGE_KEYS[module];
    const stored = await AsyncStorage.getItem(key);

    const data: DailyTime = stored ? JSON.parse(stored) : {};

    const result: Record<string, number> = {};

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const dateKey = date.toISOString().split("T")[0];

      const dayName =
        i === 0
          ? "Today"
          : date.toLocaleDateString("en-US", {
              weekday: "short",
            });

      result[dayName] = Math.round((data[dateKey] || 0) / 60);
    }

    return result;
  } catch (error) {
    console.error("Error getting weekly learning time:", error);
    return {};
  }
}

export async function getCombinedTodayTime() {
  const [dyslexic, sign] = await Promise.all([
    getLearningTime("dyslexic"),
    getLearningTime("sign"),
  ]);

  return {
    dyslexic,
    sign,
    total: dyslexic + sign,
  };
}

export async function getCombinedWeeklyTime() {
  const [dyslexic, sign] = await Promise.all([
    getWeeklyLearningTime("dyslexic"),
    getWeeklyLearningTime("sign"),
  ]);

  const days = Array.from(
    new Set([...Object.keys(dyslexic), ...Object.keys(sign)])
  );

  const combined: Record<string, number> = {};

  days.forEach((day) => {
    combined[day] = (dyslexic[day] || 0) + (sign[day] || 0);
  });

  return combined;
}