import {
  Feather,
  FontAwesome5,
  Ionicons
} from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as DocumentPicker from "expo-document-picker";
import { useFocusEffect, useRouter } from "expo-router";
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
  Text,
  View
} from "react-native";
import { HelloWave } from "../../components/hello-wave";
import { COLORS } from "../../constants/colors";
import { supabase } from "../../lib/supabase";
import { ParsedPage, parsePdfDocument } from "../../services/pdfParserService";
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

  // Easy Read reader state
  const [readerVisible, setReaderVisible] = useState(false);
  const [readerPages, setReaderPages] = useState<ParsedPage[]>([]);
  const [readerPageIdx, setReaderPageIdx] = useState(0);
  const [readerSentenceIdx, setReaderSentenceIdx] = useState<number | null>(
    null,
  );
  const [readerPlaying, setReaderPlaying] = useState(false);
  const [splitWordsOn, setSplitWordsOn] = useState(false);

  // Accessibility / Visual Adjustments Modal State & Preferences (Temporary selection vs Applied preferences)
  const [accessibilityModalVisible, setAccessibilityModalVisible] =
    useState(false);
  const [textSizeTemp, setTextSizeTemp] = useState<"A-" | "A+">("A-");
  const [typographyStyleTemp, setTypographyStyleTemp] = useState<
    "Times New Roman" | "Modern Sans"
  >("Times New Roman");
  const [lineSpacingTemp, setLineSpacingTemp] = useState<
    "Compact" | "Standard" | "Relaxed"
  >("Standard");
  const [letterSpacingTemp, setLetterSpacingTemp] = useState<
    "Tight" | "Normal" | "Wide"
  >("Normal");
  const [speechSpeedTemp, setSpeechSpeedTemp] = useState<string>("1.0x");

  // Applied Reader Preferences
  const [appliedTextSize, setAppliedTextSize] = useState<"A-" | "A+">("A-");
  const [appliedTypographyStyle, setAppliedTypographyStyle] = useState<
    "Times New Roman" | "Modern Sans"
  >("Times New Roman");
  const [appliedLineSpacing, setAppliedLineSpacing] = useState<
    "Compact" | "Standard" | "Relaxed"
  >("Standard");
  const [appliedLetterSpacing, setAppliedLetterSpacing] = useState<
    "Tight" | "Normal" | "Wide"
  >("Normal");
  const [appliedSpeechSpeed, setAppliedSpeechSpeed] = useState<string>("1.0x");

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

      const ip = await resolveServerIp();
      if (!ip || !photo?.uri) throw new Error("Camera or server unavailable");

      const ocrResult = await scanFlashcard(ip, photo.uri);
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
    const msPerChar = 90;
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

      if (Platform.OS !== "web") {
        setLoading(false);
        Alert.alert("Local extraction is set up for web only right now.");
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "application/json"],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) {
        setLoading(false);
        return;
      }

      const selectedFile = result.assets[0];
      const fileName = selectedFile.name || "document";
      const isJson =
        selectedFile.mimeType === "application/json" ||
        fileName.toLowerCase().endsWith(".json");

      const webFile = (selectedFile as any).file as Blob | undefined;
      if (!webFile) {
        setLoading(false);
        Alert.alert("Could not read the selected file.");
        return;
      }

      let parsedPages: ParsedPage[];

      if (isJson) {
        let raw: string;
        try {
          raw = await webFile.text();
        } catch (readErr) {
          setLoading(false);
          Alert.alert("Could not read the JSON file.");
          return;
        }

        let data: unknown;
        try {
          data = JSON.parse(raw);
        } catch (parseErr) {
          setLoading(false);
          Alert.alert(
            "That file isn't valid JSON. Check for a trailing comma or missing bracket.",
          );
          return;
        }

        if (!Array.isArray(data)) {
          setLoading(false);
          Alert.alert(
            "Expected a JSON array of pages, e.g. [{ pageNumber, text, sentences, syllableMap }, ...]",
          );
          return;
        }

        const looksValid = data.every(
          (p) =>
            p &&
            typeof p === "object" &&
            typeof (p as any).text === "string" &&
            Array.isArray((p as any).sentences),
        );

        if (!looksValid) {
          setLoading(false);
          Alert.alert(
            "Each page needs at least { text: string, sentences: string[] }. syllableMap is optional.",
          );
          return;
        }

        parsedPages = (data as any[]).map((p, i) => ({
          pageNumber: p.pageNumber ?? i + 1,
          text: p.text,
          sentences: p.sentences,
          syllableMap: Array.isArray(p.syllableMap) ? p.syllableMap : [],
        }));
      } else {
        parsedPages = await parsePdfDocument(webFile);

        if (
          parsedPages.length === 1 &&
          parsedPages[0].text.startsWith("Parsing error occurred:")
        ) {
          setLoading(false);
          Alert.alert("Extraction failed:\n" + parsedPages[0].text);
          return;
        }
      }

      setReaderPages(parsedPages);
      setReaderPageIdx(0);
      setReaderSentenceIdx(null);
      setReaderPlaying(false);
      setSplitWordsOn(false);
      setReaderVisible(true);
      setLoading(false);
    } catch (error) {
      console.error("pickDocument failed:", error);
      setLoading(false);
      Alert.alert("Error extracting file");
    }
  };

  const applySyllableSplits = (
    sentence: string,
    syllableMap: ParsedPage["syllableMap"],
  ) => {
    if (syllableMap.length === 0) return sentence;
    const lookup = new Map(
      syllableMap.map((entry) => [entry.original.toLowerCase(), entry.split]),
    );
    return sentence.replace(/[A-Za-z]+/g, (word) => {
      const hit = lookup.get(word.toLowerCase());
      return hit ?? word;
    });
  };

  const stopReaderSpeech = () => {
    Speech.stop();
    setReaderPlaying(false);
  };

  const getSpeechRateMultiplier = (speedStr: string) => {
    switch (speedStr) {
      case "0.5x":
        return 0.5;
      case "1.0x":
        return 1.0;
      case "1.5x":
        return 1.5;
      case "2.0x":
        return 2.0;
      default:
        return 1.0;
    }
  };

  const speakReaderSentence = (index: number) => {
    const page = readerPages[readerPageIdx];
    if (!page || index >= page.sentences.length) {
      setReaderPlaying(false);
      setReaderSentenceIdx(null);
      return;
    }

    setReaderSentenceIdx(index);
    setReaderPlaying(true);

    Speech.speak(page.sentences[index], {
      rate: getSpeechRateMultiplier(appliedSpeechSpeed),
      onDone: () => speakReaderSentence(index + 1),
      onStopped: () => setReaderPlaying(false),
      onError: () => setReaderPlaying(false),
    });
  };

  const handleReaderReadAloud = () => {
    if (readerPlaying) {
      stopReaderSpeech();
    } else {
      speakReaderSentence(readerSentenceIdx ?? 0);
    }
  };

  const handleReaderPrev = () => {
    if (readerPageIdx === 0) return;
    stopReaderSpeech();
    setReaderPageIdx((idx) => idx - 1);
    setReaderSentenceIdx(null);
  };

  const handleReaderNext = () => {
    if (readerPageIdx >= readerPages.length - 1) return;
    stopReaderSpeech();
    setReaderPageIdx((idx) => idx + 1);
    setReaderSentenceIdx(null);
  };

  const closeReader = () => {
    stopReaderSpeech();
    setReaderVisible(false);
  };

  // Helper styles computed dynamically based on applied accessibility preferences
  const getDynamicReaderSentenceStyle = () => {
    let fontSize = 16;
    if (appliedTextSize === "A+") fontSize = 20;
    if (appliedTextSize === "A-") fontSize = 14;

    let lineHeight = 24;
    if (appliedLineSpacing === "Compact") lineHeight = 20;
    if (appliedLineSpacing === "Relaxed") lineHeight = 32;

    let letterSpacing = 0;
    if (appliedLetterSpacing === "Tight") letterSpacing = -0.5;
    if (appliedLetterSpacing === "Wide") letterSpacing = 2;

    const fontFamily =
      appliedTypographyStyle === "Times New Roman" ? "serif" : "sans-serif";

    return {
      fontSize,
      lineHeight,
      letterSpacing,
      fontFamily,
    };
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
                <Text style={styles.actionButtonLabel}>Easy Read </Text>
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

      <Modal
        visible={readerVisible}
        animationType="slide"
        onRequestClose={closeReader}
      >
        <View style={styles.readerContainer}>
          <ScrollView contentContainerStyle={styles.readerScrollContent}>
            {readerPages[readerPageIdx]?.sentences.map((sentence, idx) => {
              const isCurrent = idx === readerSentenceIdx;
              const displayText = splitWordsOn
                ? applySyllableSplits(
                    sentence,
                    readerPages[readerPageIdx]?.syllableMap ?? [],
                  )
                : sentence;

              return (
                <Text
                  key={idx}
                  style={[
                    styles.readerSentence,
                    getDynamicReaderSentenceStyle(),
                    isCurrent && styles.readerSentenceActive,
                  ]}
                >
                  {displayText}
                </Text>
              );
            })}
          </ScrollView>

          <View style={styles.readerToolbarRow}>
            <Pressable
              style={[
                styles.readerNavButton,
                readerPageIdx === 0 && styles.readerNavButtonDisabled,
              ]}
              onPress={handleReaderPrev}
              disabled={readerPageIdx === 0}
            >
              <Ionicons
                name="arrow-back"
                size={16}
                color={readerPageIdx === 0 ? "#CBD5E1" : "#3B82F6"}
              />
              <Text
                style={[
                  styles.readerNavText,
                  readerPageIdx === 0 && styles.readerNavTextDisabled,
                ]}
              >
                Prev
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.splitWordsPill,
                splitWordsOn && styles.splitWordsPillActive,
              ]}
              onPress={() => setSplitWordsOn((v) => !v)}
            >
              <Ionicons name="ellipse" size={10} color="#7C3AED" />
              <Text style={styles.splitWordsText}>Split Words</Text>
            </Pressable>

            <Pressable
              style={styles.readAloudButton}
              onPress={handleReaderReadAloud}
            >
              <Ionicons
                name={readerPlaying ? "pause" : "play"}
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.readAloudText}>
                {readerPlaying ? "Pause" : "Read Aloud"}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.readerNavButton,
                readerPageIdx >= readerPages.length - 1 &&
                  styles.readerNavButtonDisabled,
              ]}
              onPress={handleReaderNext}
              disabled={readerPageIdx >= readerPages.length - 1}
            >
              <Text
                style={[
                  styles.readerNavText,
                  readerPageIdx >= readerPages.length - 1 &&
                    styles.readerNavTextDisabled,
                ]}
              >
                Next
              </Text>
              <Ionicons
                name="arrow-forward"
                size={16}
                color={
                  readerPageIdx >= readerPages.length - 1
                    ? "#CBD5E1"
                    : "#3B82F6"
                }
              />
            </Pressable>
          </View>

          <Pressable
            style={styles.accessibilityLinkRow}
            onPress={() => {
              // Sync temp state with current applied state when opening modal
              setTextSizeTemp(appliedTextSize);
              setTypographyStyleTemp(appliedTypographyStyle);
              setLineSpacingTemp(appliedLineSpacing);
              setLetterSpacingTemp(appliedLetterSpacing);
              setSpeechSpeedTemp(appliedSpeechSpeed);
              setAccessibilityModalVisible(true);
            }}
          >
            <Ionicons name="settings-outline" size={14} color="#3B82F6" />
            <Text style={styles.accessibilityLinkText}>
              Adjust Accessibility Settings
            </Text>
          </Pressable>

          <Pressable style={styles.readerCloseButton} onPress={closeReader}>
            <Ionicons name="close" size={22} color="#64748B" />
          </Pressable>
        </View>
      </Modal>

      {/* Visual Adjustments / Accessibility Modal */}
      <Modal
        visible={accessibilityModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAccessibilityModalVisible(false)}
      >
        <View style={accessibilityStyles.modalOverlay}>
          <View style={accessibilityStyles.modalCard}>
            <Text style={accessibilityStyles.modalMainTitle}>
              Visual Adjustments
            </Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={accessibilityStyles.modalScroll}
            >
              {/* Text Size */}
              <View style={accessibilityStyles.sectionGroup}>
                <Text style={accessibilityStyles.sectionLabel}>
                  Text Size (
                  {appliedTextSize === "A+"
                    ? "20px"
                    : appliedTextSize === "A-"
                      ? "14px"
                      : "16px"}
                  )
                </Text>
                <View style={accessibilityStyles.optionsRow}>
                  <Pressable
                    style={[
                      accessibilityStyles.optionPillLarge,
                      textSizeTemp === "A-" &&
                        accessibilityStyles.optionPillActive,
                    ]}
                    onPress={() => setTextSizeTemp("A-")}
                  >
                    <Text
                      style={[
                        accessibilityStyles.optionText,
                        textSizeTemp === "A-" &&
                          accessibilityStyles.optionTextActive,
                      ]}
                    >
                      A-
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      accessibilityStyles.optionPillLarge,
                      textSizeTemp === "A+" &&
                        accessibilityStyles.optionPillActive,
                    ]}
                    onPress={() => setTextSizeTemp("A+")}
                  >
                    <Text
                      style={[
                        accessibilityStyles.optionText,
                        textSizeTemp === "A+" &&
                          accessibilityStyles.optionTextActive,
                      ]}
                    >
                      A+
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Typography Style */}
              <View style={accessibilityStyles.sectionGroup}>
                <Text style={accessibilityStyles.sectionLabel}>
                  Typography Style
                </Text>
                <View style={accessibilityStyles.optionsRow}>
                  <Pressable
                    style={[
                      accessibilityStyles.optionPillLarge,
                      typographyStyleTemp === "Times New Roman" &&
                        accessibilityStyles.optionPillActive,
                    ]}
                    onPress={() => setTypographyStyleTemp("Times New Roman")}
                  >
                    <Text
                      style={[
                        accessibilityStyles.optionText,
                        typographyStyleTemp === "Times New Roman" &&
                          accessibilityStyles.optionTextActive,
                      ]}
                    >
                      Times New Roman
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      accessibilityStyles.optionPillLarge,
                      typographyStyleTemp === "Modern Sans" &&
                        accessibilityStyles.optionPillActive,
                    ]}
                    onPress={() => setTypographyStyleTemp("Modern Sans")}
                  >
                    <Text
                      style={[
                        accessibilityStyles.optionText,
                        typographyStyleTemp === "Modern Sans" &&
                          accessibilityStyles.optionTextActive,
                      ]}
                    >
                      Modern Sans
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Line Spacing */}
              <View style={accessibilityStyles.sectionGroup}>
                <Text style={accessibilityStyles.sectionLabel}>
                  Line Spacing
                </Text>
                <View style={accessibilityStyles.optionsRowThree}>
                  {["Compact", "Standard", "Relaxed"].map((item) => (
                    <Pressable
                      key={item}
                      style={[
                        accessibilityStyles.optionPillSmall,
                        lineSpacingTemp === item &&
                          accessibilityStyles.optionPillActive,
                      ]}
                      onPress={() => setLineSpacingTemp(item as any)}
                    >
                      <Text
                        style={[
                          accessibilityStyles.optionText,
                          lineSpacingTemp === item &&
                            accessibilityStyles.optionTextActive,
                        ]}
                      >
                        {item}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Letter Spacing */}
              <View style={accessibilityStyles.sectionGroup}>
                <Text style={accessibilityStyles.sectionLabel}>
                  Letter Spacing
                </Text>
                <View style={accessibilityStyles.optionsRowThree}>
                  {["Tight", "Normal", "Wide"].map((item) => (
                    <Pressable
                      key={item}
                      style={[
                        accessibilityStyles.optionPillSmall,
                        letterSpacingTemp === item &&
                          accessibilityStyles.optionPillActive,
                      ]}
                      onPress={() => setLetterSpacingTemp(item as any)}
                    >
                      <Text
                        style={[
                          accessibilityStyles.optionText,
                          letterSpacingTemp === item &&
                            accessibilityStyles.optionTextActive,
                        ]}
                      >
                        {item}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Speech Speed */}
              <View style={accessibilityStyles.sectionGroup}>
                <Text style={accessibilityStyles.sectionLabel}>
                  Speech Speed
                </Text>
                <View style={accessibilityStyles.optionsRowFour}>
                  {["0.5x", "1.0x", "1.5x", "2.0x"].map((item) => (
                    <Pressable
                      key={item}
                      style={[
                        accessibilityStyles.optionPillQuad,
                        speechSpeedTemp === item &&
                          accessibilityStyles.optionPillActive,
                      ]}
                      onPress={() => setSpeechSpeedTemp(item)}
                    >
                      <Text
                        style={[
                          accessibilityStyles.optionText,
                          speechSpeedTemp === item &&
                            accessibilityStyles.optionTextActive,
                        ]}
                      >
                        {item}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>

            <Pressable
              style={accessibilityStyles.applyButton}
              onPress={() => {
                // Apply temp choices to live reader settings
                setAppliedTextSize(textSizeTemp);
                setAppliedTypographyStyle(typographyStyleTemp);
                setAppliedLineSpacing(lineSpacingTemp);
                setAppliedLetterSpacing(letterSpacingTemp);
                setAppliedSpeechSpeed(speechSpeedTemp);
                setAccessibilityModalVisible(false);
              }}
            >
              <Text style={accessibilityStyles.applyButtonText}>
                Apply Changes
              </Text>
            </Pressable>
          </View>
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
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 10,
  },
  bubbleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  bubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  aiIconTitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
  },
  aiSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 15,
  },
  simplificationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  toggleLabelGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1e293b",
  },
  aiBubble: {
    backgroundColor: "#f8fafc",
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  strategyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  strategyLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1e293b",
  },
  aiMessage: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
  },
  statsWrapper: {
    width: "90%",
    marginTop: 20,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  newStatCard: {
    backgroundColor: "white",
    flex: 1,
    marginHorizontal: 4,
    padding: 15,
    borderRadius: 16,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  newStatNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginVertical: 4,
  },
  newStatLabel: {
    fontSize: 11,
    color: "#6b7280",
  },
  actionButtonsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    backgroundColor: "white",
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  actionButtonContent: {
    alignItems: "center",
    gap: 6,
  },
  actionButtonLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1e293b",
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
    backgroundColor: "#f8fafc",
    padding: 24,
    justifyContent: "space-between",
  },
  labHeaderTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#64748b",
    letterSpacing: 1,
    textAlign: "center",
  },
  dyslexiaMainCardBody: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  syllableRenderingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },
  syllablePillBlock: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 16,
  },
  dyslexiaFontWord: {
    fontSize: 28,
  },
  flashcardControlPanelActionRow: {
    gap: 12,
  },
  soundButtonTrigger: {
    backgroundColor: "#2563eb",
    flexDirection: "row",
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  soundBtnLabelText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  recycleScanButton: {
    backgroundColor: "white",
    flexDirection: "row",
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  recycleTextLabel: {
    color: "#3b82f6",
    fontSize: 15,
    fontWeight: "600",
  },
  dismissLabBtn: {
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  dismissBtnLabel: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600",
  },
  readerContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: 50,
  },
  readerScrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  readerSentence: {
    color: "#334155",
    marginBottom: 16,
  },
  readerSentenceActive: {
    backgroundColor: "#FEF08A",
    color: "#1E293B",
  },
  readerToolbarRow: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  readerNavButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  readerNavButtonDisabled: {
    opacity: 0.5,
  },
  readerNavText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
  },
  readerNavTextDisabled: {
    color: "#CBD5E1",
  },
  splitWordsPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3E8FF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  splitWordsPillActive: {
    backgroundColor: "#E9D5FF",
    borderWidth: 1,
    borderColor: "#7C3AED",
  },
  splitWordsText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7C3AED",
  },
  readAloudButton: {
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  readAloudText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  accessibilityLinkRow: {
    position: "absolute",
    bottom: 6,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  accessibilityLinkText: {
    fontSize: 11,
    color: "#3B82F6",
    fontWeight: "600",
  },
  readerCloseButton: {
    position: "absolute",
    top: 16,
    right: 20,
    padding: 8,
  },
});

const accessibilityStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    maxWidth: 420,
    borderRadius: 24,
    padding: 24,
    maxHeight: "85%",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  modalMainTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 16,
  },
  modalScroll: {
    paddingBottom: 10,
  },
  sectionGroup: {
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  optionsRowThree: {
    flexDirection: "row",
    gap: 8,
  },
  optionsRowFour: {
    flexDirection: "row",
    gap: 6,
  },
  optionPillLarge: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  optionPillSmall: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  optionPillQuad: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  optionPillActive: {
    backgroundColor: "#0066FF",
  },
  optionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  optionTextActive: {
    color: "#FFFFFF",
  },
  applyButton: {
    backgroundColor: "#0066FF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
