import { useSignModule } from "@/hooks/useSignModule";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useFocusEffect,
  useNavigation,
} from "expo-router";
import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { CameraCollapsible } from "../../components/Cameracollaspible";
import { COLORS } from "../../constants/colors";

export default function CameraPracticeGrid() {
  const { levels, loading, error, refetch } = useSignModule();

  const navigation = useNavigation();

  const [completedLevels, setCompletedLevels] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      refetch();
    });

    return unsubscribe;
  }, [navigation, refetch]);

  useFocusEffect(
    useCallback(() => {
      const loadCompletedLevels = async () => {
        const status: Record<string, boolean> = {};

        await Promise.all(
          levels.map(async (level) => {
            const value = await AsyncStorage.getItem(
              `camera_level_${level.levelId}_completed`
            );

            status[level.levelId] = value === "true";
          })
        );

        setCompletedLevels(status);
      };

      loadCompletedLevels();
    }, [levels])
  );

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} />;
  }

  if (error) {
    return <Text style={{ margin: 16 }}>{error}</Text>;
  }

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: COLORS.white,
      }}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Camera Practice Sessions
        </Text>
      </View>

      <View style={styles.lessonsContainer}>
        {levels.map((level, index) => {
          const previousLevel = levels[index - 1];

          const locked =
            index > 0 &&
            !completedLevels[previousLevel.levelId];

          return (
            <CameraCollapsible
              key={level.levelId}
              level={level}
              locked={locked}
            />
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  lessonsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },

  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.primary,
  },
});