import { Level } from '@/types/lesson';
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { PracticeCard } from './Cardforpractice';

interface LevelCollapsibleProps {
  level: Level;
  locked?: boolean;
}

export const CameraCollapsible: React.FC<LevelCollapsibleProps> = ({
  level,
  locked,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<
    Record<string, boolean>
  >({});

  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const checkCompletion = async () => {
        // Level completion
        const levelValue = await AsyncStorage.getItem(
       `camera_level_${level.levelId}_completed`
);
        setIsLevelComplete(levelValue === "true");

        // Lesson completion
        const lessonStatus: Record<string, boolean> = {};

        await Promise.all(
          level.lessons.map(async (lesson) => {
            const value = await AsyncStorage.getItem(
          `camera_${level.levelId}_${lesson.lessonId}_completed`
);

            lessonStatus[lesson.lessonId] = value === "true";
          })
        );

        setCompletedLessons(lessonStatus);
      };

      checkCompletion();
    }, [level.levelId])
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.header, locked && { opacity: 0.5 }]}
        disabled={locked}
        onPress={() => {
          if (!locked) {
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.levelBadge,
              isLevelComplete && styles.levelBadgeComplete,
            ]}
          >
            {isLevelComplete ? (
              <Text style={styles.levelCompleteIcon}>✓</Text>
            ) : (
              <Text style={styles.levelNumber}>{level.level}</Text>
            )}
          </View>

          <View>
            <View style={styles.titleRow}>
              <Text style={styles.levelTitle}>{level.title}</Text>

              {locked && (
                <View style={styles.completeBadge}>
                  <Text
                    style={[
                      styles.completeBadgeText,
                      { color: "gray" },
                    ]}
                  >
                    <Ionicons
                      name="lock-closed"
                      size={15}
                      color="#52476b"
                    />
                  </Text>
                </View>
              )}

              {isLevelComplete && (
                <View style={styles.completeBadge}>
                  <Text style={styles.completeBadgeText}>
                    Completed
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <Text style={styles.expandIcon}>
          {isExpanded ? "▼" : "▶"}
        </Text>
      </TouchableOpacity>

      {!locked && isExpanded && (
        <View style={styles.content}>
          {level.lessons.map((lesson) => (
            <PracticeCard
              key={lesson.lessonId}
              lesson={lesson}
              completed={
                completedLessons[lesson.lessonId] ?? false
              }
              onPress={async () => {
                try {
                  await AsyncStorage.setItem(
                    "currentLesson",
                    JSON.stringify({
                      levelId: level.levelId,
                      lessonId: lesson.lessonId,
                    })
                  );
                } catch (e) {
                  console.error("Failed to save lesson", e);
                }

                router.push({
                  pathname: "/sign/CameraPracticeScreen",
                  params: {
                    levelId: level.levelId,
                    lessonId: lesson.lessonId,
                  },
                });
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: COLORS.cream,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },

  levelBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  levelBadgeComplete: {
    backgroundColor: "#28A745",
  },

  levelCompleteIcon: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "bold",
  },

  levelNumber: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "bold",
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  levelTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.darkGray,
  },

  completeBadge: {
    backgroundColor: "#D4EDDA",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },

  completeBadgeText: {
    color: "#1E7B34",
    fontSize: 10,
    fontWeight: "700",
  },

  expandIcon: {
    fontSize: 16,
    color: COLORS.darkGray,
  },

  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});