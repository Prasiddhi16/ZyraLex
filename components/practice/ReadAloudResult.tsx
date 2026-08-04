import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Flame,
  Mic,
  PenLine,
  Sprout,
  Type,
  Wrench,
  XCircle,
  Zap,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LetterRecognitionGame from "../../components/LetterRecognitionGame";
import SimpleWordsGame from "../../components/SimpleWordsGame";
import SyllableBasicsGame from "../../components/SyllableBasicsGame";
import ReadAloudModule from "../../components/practice/ReadAloudModule";
import { useAppProgress } from "../../hooks/useAppProgress";

// Central matched 3-level data matrices
import { practiceDataMatrix as PRACTICE_DATA_MATRIX } from "../../data/practice";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export default function DyslexicPractice() {
  const {
    currentLevel,
    setCurrentLevel,
    isLearnGatePassed,
    advanceToNextFeature,
    wordsCompletedCount,
    debugCompleteLearnModule,
  } = useAppProgress();

  const [wordIndex, setWordIndex] = useState(0);
  const [spokenText, setSpokenText] = useState("");
  const [isSentenceCorrect, setIsSentenceCorrect] = useState(false);

  const [mimoFeedback, setMimoFeedback] = useState<{
    title: string;
    message: string;
    borderColor: string;
    textColor: string;
    bgColor: string;
  } | null>(null);
  const [activeLessonGame, setActiveLessonGame] = useState<string | null>(null);

  const activeLevelKey: DifficultyLevel =
    currentLevel === "intermediate" ||
    currentLevel === "advanced" ||
    currentLevel === "beginner"
      ? (currentLevel as DifficultyLevel)
      : "beginner";

  const rawLevelRoot = PRACTICE_DATA_MATRIX[activeLevelKey];

  const selectedLevelData = useMemo(() => {
    if (!rawLevelRoot) return null;

    const searchTargets = [
      (rawLevelRoot as any).lessons,
      (rawLevelRoot as any).lessonPractice,
      (rawLevelRoot as any).BEGINNER_LESSON_DATA,
      (rawLevelRoot as any).INTERMEDIATE_LESSON_DATA,
      (rawLevelRoot as any).ADVANCED_LESSON_DATA,
      (rawLevelRoot as any).default,
      rawLevelRoot,
    ];

    let finalSimpleWords: any[] = [];
    let finalSyllableBasics: any[] = [];
    let finalLetterRec: any[] = [];

    for (const target of searchTargets) {
      if (target) {
        if (
          Array.isArray(target.simpleWords) &&
          target.simpleWords.length > 0
        ) {
          finalSimpleWords = target.simpleWords;
        }
        if (
          Array.isArray(target.syllableBasics) &&
          target.syllableBasics.length > 0
        ) {
          finalSyllableBasics = target.syllableBasics;
        }
        if (
          Array.isArray(target.letterRecognition) &&
          target.letterRecognition.length > 0
        ) {
          finalLetterRec = target.letterRecognition;
        }
      }
    }

    if (finalSimpleWords.length === 0 && (rawLevelRoot as any).lessons) {
      const nested = (rawLevelRoot as any).lessons;
      finalSimpleWords = nested?.simpleWords || [];
      finalSyllableBasics = nested?.syllableBasics || [];
      finalLetterRec = nested?.letterRecognition || [];
    }

    return {
      ...rawLevelRoot,
      simpleWords: finalSimpleWords,
      syllableBasics: finalSyllableBasics,
      letterRecognition: finalLetterRec,
    };
  }, [rawLevelRoot, activeLevelKey]);

  useEffect(() => {
    setWordIndex(0);
    setSpokenText("");
    setIsSentenceCorrect(false);
    setMimoFeedback(null);
  }, [currentLevel]);

  const totalReadAloudItems = selectedLevelData?.readAloud?.length || 0;
  const safeWordIndex = wordIndex < totalReadAloudItems ? wordIndex : 0;
  const currentEntry = selectedLevelData?.readAloud?.[safeWordIndex] || {
    sentence: "",
  };
  const currentWord = currentEntry.sentence;

  const totalSessionSteps = useMemo(() => {
    return totalReadAloudItems;
  }, [totalReadAloudItems]);

  const DIFFICULTIES = useMemo(
    () => [
      {
        id: "beginner" as const,
        label: "Beginner",
        icon: Sprout,
        words: PRACTICE_DATA_MATRIX.beginner?.readAloud?.length || 20,
      },
      {
        id: "intermediate" as const,
        label: "Intermed.",
        icon: Flame,
        words: PRACTICE_DATA_MATRIX.intermediate?.readAloud?.length || 30,
      },
      {
        id: "advanced" as const,
        label: "Advanced",
        icon: Zap,
        words: PRACTICE_DATA_MATRIX.advanced?.readAloud?.length || 40,
      },
    ],
    [],
  );

  const LESSON_ITEMS = useMemo(
    () => [
      {
        id: "LETTER_RECOGNITION",
        icon: Type,
        iconColor: "#2563EB",
        name: "Letter Recognition",
        meta: "Identify letter variants",
        bg: "#EFF6FF",
      },
      {
        id: "SIMPLE_WORDS",
        icon: PenLine,
        iconColor: "#A855F7",
        name: "Simple Words",
        meta: "Assemble structural blocks",
        bg: "#FDF4FF",
      },
      {
        id: "PHONICS_BASICS",
        icon: BookOpen,
        iconColor: "#16A34A",
        name: "Phonics Basics",
        meta: "Break down vocal sound rhythms",
        bg: "#F0FFF4",
      },
      {
        id: "READ_ALOUD",
        icon: Mic,
        iconColor: "#0891B2",
        name: "Read Aloud",
        meta: "Practice reading full sentences",
        bg: "#ECFEFF",
      },
    ],
    [],
  );

  const currentDiff = useMemo(() => {
    return DIFFICULTIES.find((d) => d.id === activeLevelKey) || DIFFICULTIES[0];
  }, [DIFFICULTIES, activeLevelKey]);

  const handleSelectDifficulty = (diff: (typeof DIFFICULTIES)[0]) => {
    setCurrentLevel(diff.id);
  };

  const handleFeatureRowPress = (featureId: string) => {
    setActiveLessonGame(featureId);
  };

  const handleGameComplete = () => {
    setActiveLessonGame(null);
    advanceToNextFeature();
  };

  const goToNextWord = () => {
    if (totalReadAloudItems === 0) return;
    setWordIndex((prev) => (prev < totalReadAloudItems - 1 ? prev + 1 : 0));
    setSpokenText("");
    setIsSentenceCorrect(false);
    setMimoFeedback(null);
  };

  // Helper clean function matching core layout standards
  const cleanWordString = (str: string) =>
    str
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
      .trim();

  const handleProcessMimoSpeech = (
    outcome: "well_done" | "keep_trying" | "rushed" | "no_speech",
    rawTranscript?: string
  ) => {
    if (!currentWord) return;
    
    // Save live stream transcription so text renders matching status tracking
    if (rawTranscript) {
      setSpokenText(rawTranscript);
    } else {
      setSpokenText(currentWord);
    }

    if (outcome === "well_done") {
      setIsSentenceCorrect(true);
      setMimoFeedback({
        title: "Well done!",
        message: `You said "${currentWord.toUpperCase()}" perfectly! Mimo is super proud of you.`,
        borderColor: "#15803D",
        textColor: "#15803D",
        bgColor: "#DCFCE7",
      });

      if (typeof advanceToNextFeature === "function") {
        advanceToNextFeature();
      }
    } else {
      setIsSentenceCorrect(false);
      if (outcome === "keep_trying") {
        setMimoFeedback({
          title: "Keep trying!",
          message: "So close! Let's try to say the words one more time together.",
          borderColor: "#B45309",
          textColor: "#B45309",
          bgColor: "#FEF3C7",
        });
      } else if (outcome === "rushed") {
        setMimoFeedback({
          title: "Oops!",
          message: "The words didn’t match. Let’s try again carefully.",
          borderColor: "#B91C1C",
          textColor: "#B91C1C",
          bgColor: "#FEE2E2",
        });
      } else if (outcome === "no_speech") {
        setMimoFeedback({
          title: "Please speak first",
          message: "We didn’t hear anything. Try saying the word aloud!",
          borderColor: "#6B7280",
          textColor: "#6B7280",
          bgColor: "#E5E7EB",
        });
      }
    }
  };

  // Build custom component to split full sentences into colored tracks
  const renderDyslexiaTrackedSentence = () => {
    if (!currentWord) return null;
    const originalWordsArray = currentWord.split(/\s+/);
    const spokenCleanedArray = cleanWordString(spokenText).split(/\s+/).filter(Boolean);

    return (
      <View style={customStyles.trackedContainer}>
        {originalWordsArray.map((w, i) => {
          const cleanedTarget = cleanWordString(w);
          const hasSpokenCorrectly = spokenCleanedArray.includes(cleanedTarget);

          return (
            <Text
              key={i}
              style={[
                customStyles.baseWordText,
                hasSpokenCorrectly ? customStyles.wordCorrect : customStyles.wordMissed,
              ]}
            >
              {w}{" "}
            </Text>
          );
        })}
      </View>
    );
  };

  if (activeLessonGame === "LETTER_RECOGNITION") {
    return (
      <LetterRecognitionGame
        level={activeLevelKey}
        data={selectedLevelData as any}
        onComplete={handleGameComplete}
        onClose={() => setActiveLessonGame(null)}
      />
    );
  }

  if (activeLessonGame === "SIMPLE_WORDS") {
    return (
      <SimpleWordsGame
        level={activeLevelKey}
        data={selectedLevelData as any}
        onComplete={handleGameComplete}
        onClose={() => setActiveLessonGame(null)}
      />
    );
  }

  if (activeLessonGame === "PHONICS_BASICS") {
    return (
      <SyllableBasicsGame
        level={activeLevelKey}
        data={selectedLevelData as any}
        onComplete={handleGameComplete}
        onClose={() => setActiveLessonGame(null)}
      />
    );
  }

  if (activeLessonGame === "READ_ALOUD") {
    return (
      <SafeAreaView style={s.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#EFF6FF" />
        <View style={s.screen}>
          <View style={s.simpleHeaderRow}>
            <TouchableOpacity
              style={s.simpleHeaderBtn}
              onPress={() => setActiveLessonGame(null)}
            >
              <ArrowLeft size={20} color="#1E3A5F" />
            </TouchableOpacity>
            <Text style={s.simpleHeaderTitle}>Read Aloud</Text>
            <View style={s.simpleHeaderSpacer} />
          </View>

          {totalReadAloudItems > 0 ? (
            <View style={{ flex: 1 }}>
              {/* Highlight Container Box Inserted Above the Core Controls */}
              <View style={customStyles.visualBox}>
                {renderDyslexiaTrackedSentence()}
              </View>

              <ReadAloudModule
                wordIndex={safeWordIndex}
                totalSentences={totalReadAloudItems}
                currentEntry={{
                  id: safeWordIndex,
                  sentence: currentEntry?.sentence || "",
                  words: (currentEntry?.sentence || "").split(" "),
                }}
                mimoFeedback={mimoFeedback}
                onSpeechResult={handleProcessMimoSpeech}
                onNextWord={isSentenceCorrect ? goToNextWord : () => {}} // Block routing unless correct
              />
            </View>
          ) : (
            <Text style={s.phonicsHint}>
              No read aloud sentences available for this level yet.
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#EFF6FF" />

      <View style={s.screen}>
        <View style={s.debugHud}>
          <View style={s.debugTextRow}>
            <Text style={s.debugText}>Learn Status:</Text>
            {isLearnGatePassed(activeLevelKey) ? (
              <View style={s.debugStatusRow}>
                <CheckCircle2 size={14} color="#15803D" />
                <Text style={[s.debugStatusText, { color: "#15803D" }]}>
                  COMPLETED
                </Text>
              </View>
            ) : (
              <View style={s.debugStatusRow}>
                <XCircle size={14} color="#B91C1C" />
                <Text style={[s.debugStatusText, { color: "#B91C1C" }]}>
                  NOT LEARNED
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={s.debugBtn}
            onPress={() => debugCompleteLearnModule(activeLevelKey)}
          >
            <Wrench size={14} color="#fff" />
            <Text style={s.debugBtnText}>Clear Gate</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContainer}
        >
          <Text style={s.pageTitle}>Practice Sessions</Text>

          {/* Difficulty Grid Panel Row */}
          <View style={s.card}>
            <Text style={s.cardTitle}>DIFFICULTY LEVEL</Text>
            <View style={s.diffRow}>
              {DIFFICULTIES.map((d) => {
                const isActive = activeLevelKey === d.id;
                return (
                  <TouchableOpacity
                    key={d.id}
                    onPress={() => handleSelectDifficulty(d)}
                    activeOpacity={0.75}
                    style={[s.diffItem, isActive && s.diffActive]}
                  >
                    <d.icon
                      size={20}
                      color={isActive ? "#FFFFFF" : "#2563EB"}
                      style={s.diffIconWrap}
                    />
                    <Text
                      style={[s.diffLabel, isActive && s.diffLabelActive]}
                      numberOfLines={1}
                    >
                      {d.label}
                    </Text>
                    <Text
                      style={[
                        s.diffWords,
                        isActive &&
                          d.id === activeLevelKey && { color: "#BFDBFE" },
                      ]}
                      numberOfLines={1}
                    >
                      {d.words} steps
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={s.progRow}>
              <View style={s.progBar}>
                <View
                  style={[
                    s.progFill,
                    {
                      width: `${Math.min((wordsCompletedCount / totalSessionSteps) * 100, 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={s.progTxt}>
                {wordsCompletedCount}/{totalSessionSteps}
              </Text>
            </View>
          </View>

          {/* Secondary Sub Games Mapping Panels List */}
          <View style={s.card}>
            <View style={s.cardTitleRow}>
              <BookOpen size={14} color="#6B9EC8" />
              <Text style={s.cardTitleText}>
                LESSON PRACTICE ({currentDiff.label})
              </Text>
            </View>
            {LESSON_ITEMS.map((item, i) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                onPress={() => handleFeatureRowPress(item.id)}
                style={[
                  s.pRow,
                  i === LESSON_ITEMS.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={s.pLeft}>
                  <View style={[s.pIcon, { backgroundColor: item.bg }]}>
                    <item.icon size={18} color={item.iconColor} />
                  </View>
                  <View style={s.pTextContainer}>
                    <Text style={s.pName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={s.pMeta} numberOfLines={1}>
                      {item.meta}
                    </Text>
                  </View>
                </View>
                <View style={s.pArr}>
                  <ChevronRight size={14} color="#6B9EC8" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// Separate new unique styles scope to avoid syntax/override conflict crashes
const customStyles = StyleSheet.create({
  visualBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    marginBottom: 10,
    alignItems: "center",
  },
  trackedContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  baseWordText: {
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  wordCorrect: {
    color: "#16A34A", // Green for exact matched spoken word
    textDecorationLine: "underline",
  },
  wordMissed: {
    color: "#EF4444", // Clear red to show users which words they are missing
  },
});

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#EFF6FF" },
  screen: { flex: 1, paddingHorizontal: "4%", paddingTop: 10 },
  scrollContainer: { paddingBottom: 60 },
  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E3A5F",
    marginBottom: 16,
    marginTop: 8,
  },

  // Debug Elements
  debugHud: {
    backgroundColor: "#DBEAFE",
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#93C5FD",
    marginBottom: 12,
  },
  debugTextRow: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginRight: 8,
  },
  debugText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E40AF",
  },
  debugStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  debugStatusText: {
    fontSize: 13,
    fontWeight: "700",
  },
  debugBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2563EB",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minHeight: 36,
    justifyContent: "center",
  },
  debugBtnText: { color: "#fff", fontSize: 12, fontWeight: "bold" },

  // Base Menu Styles Block 
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B9EC8",
    letterSpacing: 1,
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  cardTitleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B9EC8",
    letterSpacing: 1,
  },
  diffRow: { flexDirection: "row", gap: 6, justifyContent: "space-between" },
  diffItem: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
    backgroundColor: "#fff",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  diffActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  diffIconWrap: { marginBottom: 4 },
  diffLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E3A5F",
    textAlign: "center",
  },
  diffLabelActive: { color: "#fff" },
  diffWords: {
    fontSize: 10,
    color: "#6B9EC8",
    marginTop: 2,
    textAlign: "center",
  },

  progRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
  },
  progBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#BFDBFE",
    borderRadius: 99,
    overflow: "hidden",
  },
  progFill: { height: "100%", backgroundColor: "#2563EB", borderRadius: 99 },
  progTxt: { fontSize: 12, color: "#6B9EC8", fontWeight: "600" },

  pRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#DBEAFE",
    justifyContent: "space-between",
  },
  pLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  pIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  pTextContainer: { flex: 1 },
  pName: { fontSize: 15, fontWeight: "600", color: "#1E3A5F" },
  pMeta: { fontSize: 12, color: "#6B9EC8", marginTop: 2 },
  pArr: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  phonicsHint: {
    fontSize: 12,
    color: "#6B9EC8",
    marginBottom: 12,
    fontStyle: "italic",
  },

  simpleHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    marginTop: 8,
  },
  simpleHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  simpleHeaderSpacer: { width: 40 },
  simpleHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E3A5F",
  },
});