import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from "react-native";

interface WeeklyActivityProps {
  data: Record<string, number>;
}

interface TimeLimitBarProps {
  used: number;
  max: number;
}

const getDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getTodayKey = () => {
  return getDateKey(new Date());
};

const getDayLabel = (date: Date, isToday: boolean) => {
  if (isToday) return "Today";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
  });
};

const dyslexiaDummyActivity: Record<string, number> = {
  Mon: 25,
  Tue: 40,
  Wed: 35,
  Thu: 50,
  Fri: 30,
  Sat: 45,
  Today: 35,
};

export default function DashboardScreen() {
  const [moduleChoice, setModuleChoice] = useState<string | null>(null);
  const [appLocked, setAppLocked] = useState(false);
  const [timeSpentToday, setTimeSpentToday] = useState(0);
  const [weeklyActivity, setWeeklyActivity] = useState<Record<string, number>>(
    {}
  );
  const [loadingActivity, setLoadingActivity] = useState(true);

  const dailyLimit = 60;

  const loadLearningActivity = useCallback(
    async (selectedModule: string) => {
      try {
        setLoadingActivity(true);

        if (selectedModule === "dyslexic") {
          const today = dyslexiaDummyActivity.Today;

          setTimeSpentToday(today);
          setWeeklyActivity(dyslexiaDummyActivity);

          return;
        }

        const stored = await AsyncStorage.getItem("learningTime_sign");

        const data: Record<string, number> = stored
          ? JSON.parse(stored)
          : {};

        const todayKey = getTodayKey();

        const todaySeconds = data[todayKey] || 0;
        const todayMinutes = Math.floor(todaySeconds / 60);

        setTimeSpentToday(todayMinutes);

        const activity: Record<string, number> = {};

        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setHours(0, 0, 0, 0);
          date.setDate(date.getDate() - i);

          const key = getDateKey(date);
          const isToday = i === 0;
          const label = getDayLabel(date, isToday);

          activity[label] = Math.floor((data[key] || 0) / 60);
        }

        setWeeklyActivity(activity);
      } catch (error) {
        console.log("Error loading learning activity:", error);
        setTimeSpentToday(0);
        setWeeklyActivity({});
      } finally {
        setLoadingActivity(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      const loadDashboard = async () => {
        try {
          const choice = await AsyncStorage.getItem("moduleChoice");
          const lockStatus = await AsyncStorage.getItem("appLocked");

          setModuleChoice(choice);
          setAppLocked(lockStatus === "true");

          if (choice) {
            await loadLearningActivity(choice);
          } else {
            setLoadingActivity(false);
          }
        } catch (error) {
          console.log("Error loading dashboard:", error);
          setLoadingActivity(false);
        }
      };

      loadDashboard();
    }, [loadLearningActivity])
  );

  const toggleAppLock = async (value: boolean) => {
    try {
      setAppLocked(value);
      await AsyncStorage.setItem("appLocked", String(value));
    } catch (error) {
      console.log("Error updating app lock:", error);
    }
  };

  if (!moduleChoice || loadingActivity) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const isDyslexic = moduleChoice === "dyslexic";

  const moduleTitle = isDyslexic
    ? "Reading Learning Activity"
    : "Sign Language Learning Activity";

  const moduleSubtitle = isDyslexic
    ? "Monitor your child's reading and literacy activity"
    : "Monitor your child's sign language learning activity";

  const usedPercentage =
    dailyLimit > 0
      ? Math.min(
          Math.round((timeSpentToday / dailyLimit) * 100),
          100
        )
      : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Parental Dashboard</Text>

          <Text style={styles.subtitle}>{moduleSubtitle}</Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons
            name={
              isDyslexic
                ? "book-outline"
                : "hand-left-outline"
            }
            size={28}
            color="#3B82F6"
          />
        </View>
      </View>

      <View style={styles.moduleBadge}>
        <Ionicons
          name={
            isDyslexic
              ? "book-outline"
              : "hand-left-outline"
          }
          size={18}
          color="#3B82F6"
        />

        <Text style={styles.moduleBadgeText}>
          {isDyslexic
            ? "Dyslexia Learning Module"
            : "Sign Language Module"}
        </Text>
      </View>

      <View style={styles.todayCard}>
        <View style={styles.todayHeader}>
          <View>
            <Text style={styles.cardLabel}>Time Spent Today</Text>

            <Text style={styles.todayValue}>
              {timeSpentToday}{" "}
              <Text style={styles.minutesText}>min</Text>
            </Text>
          </View>

          <View style={styles.timeIcon}>
            <Ionicons
              name="time-outline"
              size={28}
              color="#3B82F6"
            />
          </View>
        </View>

        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${usedPercentage}%`,
              },
            ]}
          />
        </View>

        <View style={styles.limitRow}>
          <Text style={styles.limitText}>
            {timeSpentToday} of {dailyLimit} minutes used
          </Text>

          <Text style={styles.limitPercentage}>
            {usedPercentage}%
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Activity</Text>

        <Text style={styles.sectionSubtitle}>
          {moduleTitle} over the last 7 days
        </Text>

        <WeeklyActivity data={weeklyActivity} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Time Limit</Text>

        <Text style={styles.sectionSubtitle}>
          Control how long your child can use the app
        </Text>

        <TimeLimitBar
          used={timeSpentToday}
          max={dailyLimit}
        />
      </View>

      <View style={styles.securityCard}>
        <View style={styles.securityIcon}>
          <Ionicons
            name={
              appLocked
                ? "lock-closed-outline"
                : "lock-open-outline"
            }
            size={26}
            color={appLocked ? "#2563EB" : "#16A34A"}
          />
        </View>

        <View style={styles.securityInfo}>
          <Text style={styles.securityTitle}>
            App Lock
          </Text>

          <Text style={styles.securityDescription}>
            {appLocked
              ? "The app is currently locked"
              : "The app is currently unlocked"}
          </Text>
        </View>

        <Switch
          value={appLocked}
          onValueChange={toggleAppLock}
          trackColor={{
            false: "#CBD5E1",
            true: "#93C5FD",
          }}
          thumbColor={
            appLocked
              ? "#2563EB"
              : "#F8FAFC"
          }
        />
      </View>
    </ScrollView>
  );
}

function WeeklyActivity({
  data,
}: WeeklyActivityProps) {
  const entries = Object.entries(data);

  const maxMinutes =
    entries.length > 0
      ? Math.max(...entries.map(([, value]) => value), 1)
      : 1;

  const totalMinutes = entries.reduce(
    (sum, [, value]) => sum + value,
    0
  );

  return (
    <View style={styles.weeklyCard}>
      <View style={styles.weeklySummary}>
        <View>
          <Text style={styles.weeklyTotal}>
            {totalMinutes}
          </Text>

          <Text style={styles.weeklyTotalLabel}>
            Total minutes this week
          </Text>
        </View>

        <View style={styles.weeklyIcon}>
          <Ionicons
            name="bar-chart-outline"
            size={24}
            color="#3B82F6"
          />
        </View>
      </View>

      <View style={styles.chart}>
        {entries.map(([day, minutes]) => {
          const height =
            minutes > 0
              ? Math.max(
                  (minutes / maxMinutes) * 120,
                  8
                )
              : 4;

          return (
            <View
              key={day}
              style={styles.barColumn}
            >
              <Text style={styles.barValue}>
                {minutes}
              </Text>

              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height,
                      opacity:
                        minutes > 0 ? 1 : 0.3,
                    },
                  ]}
                />
              </View>

              <Text
                style={[
                  styles.dayLabel,
                  day === "Today" &&
                    styles.todayDayLabel,
                ]}
              >
                {day}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function TimeLimitBar({
  used,
  max,
}: TimeLimitBarProps) {
  const percent =
    max > 0
      ? Math.min(
          Math.round((used / max) * 100),
          100
        )
      : 0;

  const remaining = Math.max(
    max - used,
    0
  );

  return (
    <View style={styles.limitCard}>
      <View style={styles.limitHeader}>
        <View>
          <Text style={styles.limitUsed}>
            {used} / {max} minutes
          </Text>

          <Text style={styles.remainingText}>
            {remaining} minutes remaining
          </Text>
        </View>

        <Text style={styles.percentText}>
          {percent}%
        </Text>
      </View>

      <View style={styles.limitProgressBackground}>
        <View
          style={[
            styles.limitProgressFill,
            {
              width: `${percent}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F8FC",
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F8FC",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#64748B",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1E293B",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 5,
    maxWidth: 280,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E8F1FF",
    alignItems: "center",
    justifyContent: "center",
  },
  moduleBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#E8F1FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
    gap: 7,
  },
  moduleBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
  },
  todayCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    elevation: 3,
    shadowColor: "#64748B",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  todayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLabel: {
    fontSize: 15,
    color: "#64748B",
    fontWeight: "500",
  },
  todayValue: {
    fontSize: 38,
    fontWeight: "800",
    color: "#1E293B",
    marginTop: 5,
  },
  minutesText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748B",
  },
  timeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E8F1FF",
    alignItems: "center",
    justifyContent: "center",
  },
  progressBackground: {
    height: 10,
    backgroundColor: "#D9E8FC",
    borderRadius: 10,
    marginTop: 20,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3B82F6",
    borderRadius: 10,
  },
  limitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  limitText: {
    fontSize: 12,
    color: "#64748B",
  },
  limitPercentage: {
    fontSize: 12,
    fontWeight: "700",
    color: "#3B82F6",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#1E293B",
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
    marginBottom: 12,
  },
  weeklyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: "#64748B",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  weeklySummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  weeklyTotal: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1E293B",
  },
  weeklyTotalLabel: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  weeklyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E8F1FF",
    alignItems: "center",
    justifyContent: "center",
  },
  chart: {
    height: 180,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 20,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  barValue: {
    fontSize: 10,
    color: "#94A3B8",
    marginBottom: 5,
  },
  barContainer: {
    height: 120,
    width: 22,
    justifyContent: "flex-end",
    backgroundColor: "#F4F8FC",
    borderRadius: 10,
    overflow: "hidden",
  },
  bar: {
    width: "100%",
    backgroundColor: "#3B82F6",
    borderRadius: 10,
  },
  dayLabel: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 8,
  },
  todayDayLabel: {
    color: "#3B82F6",
    fontWeight: "800",
  },
  limitCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: "#64748B",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  limitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  limitUsed: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1E293B",
  },
  remainingText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  percentText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#3B82F6",
  },
  limitProgressBackground: {
    height: 10,
    backgroundColor: "#D9E8FC",
    borderRadius: 10,
    marginTop: 18,
    overflow: "hidden",
  },
  limitProgressFill: {
    height: "100%",
    backgroundColor: "#3B82F6",
    borderRadius: 10,
  },
  securityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#64748B",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  securityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E8F1FF",
    alignItems: "center",
    justifyContent: "center",
  },
  securityInfo: {
    flex: 1,
    marginLeft: 14,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  securityDescription: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 3,
  },
});