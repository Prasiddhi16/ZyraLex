import {
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useFocusEffect, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import * as Speech from "expo-speech";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { HelloWave } from "../../components/hello-wave";
import { COLORS } from "../../constants/colors";
import { supabase } from "../../lib/supabase";
import { fetchSyllables, scanFlashcard } from "../../utils/flashcard";
import {
  getLessonKeyForWeakArea,
  LESSON_COUNTS_PER_LEVEL,
} from "../../utils/progress";
import {
  clearServerIpOverride,
  resolveServerIp,
} from "../../utils/serverConfig";
import { getWordOfTheDay } from "../../utils/wordOffDay";

const LEVEL_ORDER = ["level1", "level2", "level3", "level4", "level5"];

export default function DyslexicHome() {
  const router = useRouter();

  const [isSimplified, setIsSimplified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [simplifiedText, setSimplifiedText] = useState("");

  const [flashcardModalVisible, setFlashcardModalVisible] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [activeSyllableIndex, setActiveSyllableIndex] = useState<number | null>(
    null,
  );
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [currentWord, setCurrentWord] = useState("");
  const [syllables, setSyllables] = useState<string[]>([]);

  const [dbLoading, setDbLoading] = useState(true);
  const [score, setScore] = useState<number>(0);
  const [level, setLevel] = useState<string>("Beginner");
  const [weakArea, setWeakArea] = useState<string>("None");
  const [reviewMessage, setReviewMessage] = useState<string>(
    "Take your assessment to begin.",
  );
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [completedLessonsCount, setCompletedLessonsCount] = useState<number>(0);
  const [wordSource, setWordSource] = useState<"daily" | "scanned">("daily");
  const [completedLevels, setCompletedLevels] = useState<string[]>([]);
  const [currentLevelKey, setCurrentLevelKey] = useState<string>("level1");
  const [lessonsTotal, setLessonsTotal] = useState<number>(5);

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, []),
  );

  useEffect(() => {
    clearServerIpOverride();
  }, []);

  useEffect(() => {
    const checkAssessment = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("assessments")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!data) {
        router.replace("/dyslexic/learn");
      }
    };
    checkAssessment();
  }, []);

  const fetchUserData = async () => {
    try {
      setDbLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: assessmentData, error: assessmentError } = await supabase
        .from("assessments")
        .select("score, level, weak_area, review")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (assessmentError) throw assessmentError;

      let latestWeakArea = "None";
      if (assessmentData && assessmentData.length > 0) {
        const latest = assessmentData[0];
        setScore(latest.score ?? 0);
        setLevel(latest.level || "Beginner");
        latestWeakArea = latest.weak_area || "None";
        setWeakArea(latestWeakArea);
        setReviewMessage(latest.review || "Take your assessment to begin.");
      } else {
        setScore(0);
        setLevel("Beginner");
        setWeakArea("None");
        setReviewMessage("Take your assessment to begin.");
      }

      const { data: completions } = await supabase
        .from("lesson_completions")
        .select("level_key, lesson_key, score")
        .eq("user_id", user.id)
        .eq("completed", true);

      const { data: progressRow } = await supabase
        .from("dyslexic_user_progress")
        .select("current_level, current_lesson, completed_levels")
        .eq("user_id", user.id)
        .maybeSingle();

      const currentLevel = progressRow?.current_level ?? "level1";
      setCurrentLevelKey(currentLevel);
      setCompletedLevels(progressRow?.completed_levels ?? []);

      const targetLessonKey =
        progressRow?.current_lesson ?? getLessonKeyForWeakArea(latestWeakArea);
      const totalForLevel = LESSON_COUNTS_PER_LEVEL[currentLevel] ?? 5;
      setLessonsTotal(totalForLevel);

      if (completions) {
        const completedInLevel = completions.filter(
          (c) =>
            c.level_key === currentLevel && c.lesson_key === targetLessonKey,
        ).length;

        setCompletedLessonsCount(completedInLevel);
        setProgressPercent(
          Math.min(100, Math.round((completedInLevel / totalForLevel) * 100)),
        );
      }
    } catch (err) {
      console.error("Error reading dashboard statistics: ", err);
    } finally {
      setDbLoading(false);
    }
  };

  const handleFlashcardPress = async () => {
    setFlashcardModalVisible(true);
    setActiveSyllableIndex(null);
    setIsScanning(true);

    try {
      const ip = await resolveServerIp();
      if (!ip) throw new Error("Server not configured");

      const word = getWordOfTheDay();
      const result = await fetchSyllables(ip, word);
      setCurrentWord(result.word);
      setSyllables(result.syllables);
      setWordSource("daily");
    } catch (err) {
      console.error("Failed to load word of the day:", err);
      setCurrentWord("beautiful");
      setSyllables(["beau", "ti", "ful"]);
      setWordSource("daily");
    } finally {
      setIsScanning(false);
    }
  };

  const handleScanCard = async () => {
    const { granted } = await requestCameraPermission();
    console.log("DEBUG camera granted:", granted);
    if (!granted) return;
    setShowCamera(true);
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    setIsScanning(true);
    setShowCamera(false);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: false,
      });
      console.log("DEBUG photo:", photo);

      const ip = await resolveServerIp();
      console.log("DEBUG scan ip:", ip);
      if (!ip || !photo?.uri) throw new Error("Camera or server unavailable");

      const ocrResult = await scanFlashcard(ip, photo.uri);
      console.log("DEBUG ocrResult:", ocrResult);
      if (!ocrResult.word) {
        Alert.alert(
          "Couldn't read a word from that photo — try again with better lighting.",
        );
        return;
      }

      const syllableResult = await fetchSyllables(ip, ocrResult.word);
      setCurrentWord(syllableResult.word);
      setSyllables(syllableResult.syllables);
      setWordSource("scanned");
    } catch (err) {
      console.error("Scan failed:", err);
      Alert.alert("Couldn't scan that card. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  const handlePlayPronunciation = () => {
    if (isPlayingAudio || syllables.length === 0 || !currentWord) return;
    setIsPlayingAudio(true);
    const msPerChar = 90; // tuned rough estimate for rate 0.85
    const totalDuration = currentWord.length * msPerChar;
    const perSyllable = totalDuration / syllables.length;

    let idx = 0;
    const highlightStep = () => {
      if (idx < syllables.length) {
        setActiveSyllableIndex(idx);
        idx++;
        setTimeout(highlightStep, perSyllable);
      } else {
        setActiveSyllableIndex(null);
      }
    };

    Speech.speak(currentWord, {
      language: "en",
      rate: 0.85,
      onDone: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false),
    });
    highlightStep();
  };

  const pickDocument = async () => {
    try {
      setLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "text/plain"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const selectedFile = result.assets[0];
      const formData = new FormData();
      const type = selectedFile.mimeType || "application/pdf";

      formData.append("file", {
        uri: selectedFile.uri,
        name: selectedFile.name || "temp_file.pdf",
        type: type,
      } as any);

      const response = await fetch(
        "https://grinch-cloak-grazing.ngrok-free.app/simplify",
        {
          method: "POST",
          body: formData as any,
          headers: {
            Accept: "application/pdf",
            "ngrok-skip-browser-warning": "true",
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        setLoading(false);
        Alert.alert("Backend Error:\n" + errorText);
        return;
      }

      const blob = await response.blob();
      const fileUri = FileSystem.documentDirectory + "simplified.pdf";
      const reader = new FileReader();

      reader.onloadend = async () => {
        try {
          const base64data = (reader.result as string).split(",")[1];
          await FileSystem.writeAsStringAsync(fileUri, base64data, {
            encoding: FileSystem.EncodingType.Base64,
          });
          setLoading(false);
          Alert.alert("Your simplified PDF is ready!");
          await Sharing.shareAsync(fileUri);
        } catch (saveError) {
          setLoading(false);
          Alert.alert("Failed to save PDF");
        }
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      setLoading(false);
      Alert.alert("Error simplifying file");
    }
  };

  if (dbLoading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ marginTop: 12, color: "#6b7280", fontWeight: "600" }}>
          Syncing profile metrics...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeSection}>
          <HelloWave />
          <Text style={styles.welcomeTitle}>Welcome Back!</Text>
          <Text style={styles.welcomeSubtitle}>
            Continue your learning journey
          </Text>
        </View>

        <View style={styles.mainCard}>
          <View style={styles.levelHeader}>
            <View style={styles.iconCircleBlue}>
              <FontAwesome5 name="seedling" size={24} color="white" />
            </View>
            <View style={styles.levelTextContainer}>
              <Text style={styles.levelTitle}>{level.toUpperCase()}</Text>
              <Text style={styles.levelSubtitle}>
                {isSimplified
                  ? "Current Program Track"
                  : "Current Path Tracking"}
              </Text>
            </View>
            <View style={styles.xpContainer}>
              <Text style={styles.xpText}>{completedLessonsCount * 25} XP</Text>
              <Text style={styles.xpSubtext}>
                Lessons: {completedLessonsCount}/{lessonsTotal}
              </Text>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
            />
          </View>
          <Text style={styles.progressPercent}>
            {progressPercent}% of {currentLevelKey.replace("level", "Level ")}{" "}
            completed
          </Text>
          <View style={styles.bubbleRow}>
            {LEVEL_ORDER.map((lvl) => {
              const isCompleted = completedLevels.includes(lvl);
              const isCurrent = lvl === currentLevelKey;
              const isUnlocked = isCompleted || isCurrent;

              return (
                <View
                  key={lvl}
                  style={[styles.bubble, isUnlocked && styles.activeBubble]}
                >
                  <Ionicons
                    name={
                      isCompleted
                        ? "checkmark"
                        : isCurrent
                          ? "play"
                          : "lock-closed"
                    }
                    size={16}
                    color={isUnlocked ? "white" : "#d1d5db"}
                  />
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.statsWrapper}>
          <View style={styles.statsGrid}>
            <View style={styles.newStatCard}>
              <Ionicons name="trending-up" size={24} color="#3b82f6" />
              <Text style={styles.newStatNumber}>{score}/10</Text>
              <Text style={styles.newStatLabel}>Latest Score</Text>
            </View>
            <View style={styles.newStatCard}>
              <Ionicons name="alert-circle" size={24} color="#3b82f6" />
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  color: "#3b82f6",
                  marginVertical: 6,
                  textAlign: "center",
                }}
              >
                {weakArea.replace("_", "\n").toUpperCase()}
              </Text>
              <Text style={styles.newStatLabel}>Weak Area</Text>
            </View>
            <View style={styles.newStatCard}>
              <Ionicons name="rocket" size={24} color="#3b82f6" />
              <Text style={styles.newStatNumber}>{progressPercent}%</Text>
              <Text style={styles.newStatLabel}>Completion</Text>
            </View>
          </View>

          <View style={styles.actionButtonsSection}>
            <Pressable
              style={styles.actionButton}
              onPress={() => router.push("/dyslexic/learn")}
            >
              <View style={styles.actionButtonContent}>
                <Ionicons name="clipboard-outline" size={24} color="#3b82f6" />
                <Text style={styles.actionButtonLabel}>Take Assessment</Text>
              </View>
            </Pressable>

            <Pressable style={styles.actionButton} onPress={pickDocument}>
              <View style={styles.actionButtonContent}>
                <Feather name="upload-cloud" size={24} color="#3b82f6" />
                <Text style={styles.actionButtonLabel}>Easy Read PDF</Text>
              </View>
            </Pressable>

            <Pressable
              style={styles.actionButton}
              onPress={handleFlashcardPress}
            >
              <View style={styles.actionButtonContent}>
                <Feather name="layers" size={24} color="#3b82f6" />
                <Text style={styles.actionButtonLabel}>Flashcard</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>
              Simplifying text structure...
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={false}
        visible={flashcardModalVisible}
        onRequestClose={() => setFlashcardModalVisible(false)}
      >
        <View style={styles.flashcardContainerCanvas}>
          <Text style={styles.labHeaderTitle}>
            {currentWord
              ? `${wordSource === "daily" ? "WORD OF THE DAY" : "SCANNED WORD"}: ${currentWord.toUpperCase()}`
              : "FLASHCARD CAM LAB"}
          </Text>

          <View style={styles.dyslexiaMainCardBody}>
            {isScanning ? (
              <View style={{ alignItems: "center" }}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text
                  style={{
                    marginTop: 14,
                    color: "#475569",
                    fontWeight: "600",
                  }}
                >
                  Scanning Flashcard Document...
                </Text>
              </View>
            ) : (
              <View style={styles.syllableRenderingRow}>
                {syllables.map((syllable, index) => {
                  const isFocused = activeSyllableIndex === index;
                  return (
                    <View
                      key={index}
                      style={[
                        styles.syllablePillBlock,
                        { backgroundColor: isFocused ? "#dbeafe" : "#f1f5f9" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dyslexiaFontWord,
                          {
                            color: isFocused ? "#2563eb" : "#1e293b",
                            fontWeight: isFocused ? "bold" : "normal",
                          },
                        ]}
                      >
                        {syllable}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {!isScanning && (
            <View style={styles.flashcardControlPanelActionRow}>
              <Pressable
                style={[
                  styles.soundButtonTrigger,
                  { opacity: isPlayingAudio ? 0.6 : 1 },
                ]}
                onPress={handlePlayPronunciation}
                disabled={isPlayingAudio}
              >
                <Ionicons
                  name={
                    isPlayingAudio ? "volume-high" : "volume-medium-outline"
                  }
                  size={22}
                  color="white"
                />
                <Text style={styles.soundBtnLabelText}>
                  {isPlayingAudio ? "Pronouncing..." : "Listen & Follow"}
                </Text>
              </Pressable>

              <Pressable
                style={styles.recycleScanButton}
                onPress={handleScanCard}
              >
                <Ionicons name="camera-outline" size={20} color="#3b82f6" />
                <Text style={styles.recycleTextLabel}>
                  Scan a Physical Card
                </Text>
              </Pressable>

              <Pressable
                style={styles.dismissLabBtn}
                onPress={() => setFlashcardModalVisible(false)}
              >
                <Text style={styles.dismissBtnLabel}>Close</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>

      <Modal visible={showCamera} animationType="slide">
        <View style={{ flex: 1 }}>
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing={Platform.OS === "web" ? "front" : "back"}
          />
          <View style={{ padding: 20, backgroundColor: "#000" }}>
            <Pressable
              style={[styles.soundButtonTrigger, { marginBottom: 10 }]}
              onPress={handleCapture}
            >
              <Ionicons name="camera" size={22} color="white" />
              <Text style={styles.soundBtnLabelText}>Capture</Text>
            </Pressable>
            <Pressable
              style={styles.dismissLabBtn}
              onPress={() => setShowCamera(false)}
            >
              <Text style={[styles.dismissBtnLabel, { color: "white" }]}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f9ff",
  },
  scrollContent: {
    paddingBottom: 100,
    alignItems: "center",
  },
  welcomeSection: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.darkGray,
    marginBottom: 4,
    textAlign: "center",
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: "center",
  },
  mainCard: {
    backgroundColor: "white",
    width: "90%",
    marginTop: 20,
    padding: 20,
    borderRadius: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  levelHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  iconCircleBlue: {
    width: 50,
    height: 50,
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  levelTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
  },
  levelSubtitle: {
    color: "#6b7280",
    fontSize: 13,
  },
  xpContainer: {
    alignItems: "flex-end",
  },
  xpText: {
    color: "#3b82f6",
    fontWeight: "bold",
    fontSize: 15,
  },
  xpSubtext: {
    fontSize: 10,
    color: "#9ca3af",
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    marginVertical: 10,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: 4,
  },
  progressPercent: {
    textAlign: "center",
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "500",
  },
  bubbleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  bubble: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  activeBubble: {
    backgroundColor: "#3b82f6",
  },
  aiCard: {
    backgroundColor: "white",
    width: "90%",
    marginTop: 20,
    padding: 20,
    borderRadius: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  aiHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  aiIconTitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 5,
    color: "#1e293b",
  },
  aiSubtitle: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 10,
    marginLeft: 5,
  },
  simplificationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  toggleLabelGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1e40af",
    marginLeft: 8,
  },
  aiBubble: {
    backgroundColor: "#f8fafc",
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  strategyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  strategyLabel: {
    fontWeight: "bold",
    fontSize: 12,
    color: "#1e293b",
    marginLeft: 4,
  },
  aiMessage: {
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 18,
  },
  statsWrapper: {
    width: "100%",
    marginTop: 25,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    gap: 12,
  },
  newStatCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  newStatNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3b82f6",
    marginBottom: 4,
  },
  newStatLabel: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "500",
    textAlign: "center",
  },
  actionButtonsSection: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  actionButtonContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionButtonLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2937",
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#3b82f6",
    fontWeight: "600",
  },
  flashcardContainerCanvas: {
    flex: 1,
    backgroundColor: "#f0f9ff",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  labHeaderTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 2,
    marginBottom: 20,
  },
  dyslexiaMainCardBody: {
    width: "95%",
    backgroundColor: "white",
    borderRadius: 28,
    paddingVertical: 50,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    marginBottom: 35,
  },
  syllableRenderingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  syllablePillBlock: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  dyslexiaFontWord: {
    fontFamily: "OpenDyslexic",
    fontSize: 34,
    textAlign: "center",
    letterSpacing: 1,
  },
  flashcardControlPanelActionRow: {
    width: "95%",
    gap: 14,
  },
  soundButtonTrigger: {
    backgroundColor: "#2563eb",
    flexDirection: "row",
    height: 58,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    elevation: 2,
  },
  soundBtnLabelText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  recycleScanButton: {
    backgroundColor: "white",
    flexDirection: "row",
    height: 54,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: "#3b82f6",
  },
  recycleTextLabel: {
    color: "#3b82f6",
    fontSize: 15,
    fontWeight: "700",
  },
  dismissLabBtn: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  dismissBtnLabel: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600",
  },
});
