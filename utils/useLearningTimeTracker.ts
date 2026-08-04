import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";

export type LearningModule = "dyslexic" | "sign";

const getStorageKey = (module: LearningModule) =>
  `learningTime_${module}`;

const getTodayKey = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const saveLearningTime = async (
  module: LearningModule,
  seconds: number
) => {
  if (seconds <= 0) return;

  try {
    const key = getStorageKey(module);
    const stored = await AsyncStorage.getItem(key);

    const data: Record<string, number> = stored
      ? JSON.parse(stored)
      : {};

    const today = getTodayKey();

    data[today] = (data[today] || 0) + seconds;

    await AsyncStorage.setItem(
      key,
      JSON.stringify(data)
    );
  } catch (error) {
    console.log("Error saving learning time:", error);
  }
};

export function useLearningTimeTracker(
  module: LearningModule
) {
  const startTime = useRef<number | null>(null);
  const appState = useRef(AppState.currentState);

  const saveElapsedTime = useCallback(async () => {
    if (startTime.current === null) {
      return;
    }

    const elapsedSeconds = Math.floor(
      (Date.now() - startTime.current) / 1000
    );

    if (elapsedSeconds > 0) {
      await saveLearningTime(
        module,
        elapsedSeconds
      );
    }

    startTime.current = Date.now();
  }, [module]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextState) => {
        if (
          appState.current === "active" &&
          (nextState === "inactive" ||
            nextState === "background")
        ) {
          await saveElapsedTime();
          startTime.current = null;
        }

        if (
          nextState === "active" &&
          appState.current !== "active"
        ) {
          startTime.current = Date.now();
        }

        appState.current = nextState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [saveElapsedTime]);

  useFocusEffect(
    useCallback(() => {
      startTime.current = Date.now();

      const interval = setInterval(() => {
        saveElapsedTime();
      }, 30000);

      return () => {
        clearInterval(interval);
        saveElapsedTime();
        startTime.current = null;
      };
    }, [saveElapsedTime])
  );
}