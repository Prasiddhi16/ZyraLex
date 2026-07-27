import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  Flame,
  Lock,
  Mic,
  PenLine,
  Sprout,
  Type,
  Wrench,
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
import ProgressBar from "../../components/practice/ProgressBar";
import ReadAloudModule from "../../components/practice/ReadAloudModule";
import { useAppProgress } from "../../hooks/useAppProgress";
import { stopSpeech } from "../../services/speech";
import { EvaluationResult } from "../../services/voice";
import { LEARN_LEVEL_KEYS } from "../../utils/constants";
// Central matched 3-level data matrices
import { practiceDataMatrix as PRACTICE_DATA_MATRIX } from "../../data/practice";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export default function DyslexicPractice() {
  const {
    currentLevel,
    setCurrentLevel,
    isLearnGatePassed,
    getLockMessage,
    advanceToNextFeature,
    wordsCompletedCount,
    practiceProgress,
    allPracticeProgress,
    learnStatus,
    debugCompleteLearnModule,
  } = useAppProgress();

  const [wordIndex, setWordIndex] = useState(0);
  const [spokenText, setSpokenText] = useState("");
  const [isSentenceCorrect, setIsSentenceCorrect] = useState(false);
  const [lastAccuracy, setLastAccuracy] = useState(0);

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
        if (Array.isArray(target.simpleWords) && target.simpleWords.length > 0) {
          finalSimpleWords = target.simpleWords;
        }
        if (Array.isArray(target.syllableBasics) && target.syllableBasics.length > 0) {
          finalSyllableBasics = target.syllableBasics;
        }
        if (Array.isArray(target.letterRecognition) && target.letterRecognition.length > 0) {
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
    setSpokenText("");
    setIsSentenceCorrect(false);
    setLastAccuracy(0);
    setMimoFeedback(null);
  }, [currentLevel, activeLessonGame]);

  useEffect(() => {
    const total = selectedLevelData?.readAloud?.length || 0;
    const resumeIndex = total > 0 ? Math.min(practiceProgress.lastIndex, total - 1) : 0;
    setWordIndex(resumeIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLevel, selectedLevelData]);

  useEffect(() => {
    if (!activeLessonGame) {
      stopSpeech();
    }
  }, [activeLessonGame]);

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
        label: "Intermediate",
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

  const learnLevelsCompletedCount = useMemo(
    () => LEARN_LEVEL_KEYS.filter((key) => !!learnStatus[key]).length,
    [learnStatus]
  );

  const handleSelectDifficulty = (diff: (typeof DIFFICULTIES)[0]) => {
    if (!isLearnGatePassed(diff.id)) return;
    setCurrentLevel(diff.id);
  };

  const handleFeatureRowPress = (featureId: string) => {
    if (!isLearnGatePassed(activeLevelKey)) return;
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
    setLastAccuracy(0);
    setMimoFeedback(null);
  };

  const clearFeedbackForRetry = () => {
    setSpokenText("");
    setIsSentenceCorrect(false);
    setLastAccuracy(0);
    setMimoFeedback(null);
  };

  const cleanWordString = (str: string) =>
    str
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
      .trim();

  const handleProcessMimoSpeech = (
    outcome: EvaluationResult,
    transcript: string,
    accuracy: number
  ) => {
    if (!currentWord) return;

    setSpokenText(transcript);
    setLastAccuracy(accuracy);

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
          message: `You got ${accuracy}% of the words right. Let's try saying it again together.`,
          borderColor: "#B45309",
          textColor: "#B45309",
          bgColor: "#FEF3C7",
        });
      } else if (outcome === "rushed") {
        setMimoFeedback({
          title: "Oops!",
          message: "The words didn't match. Let's try again carefully.",
          borderColor: "#B91C1C",
          textColor: "#B91C1C",
          bgColor: "#FEE2E2",
        });
      } else if (outcome === "no_speech") {
        setMimoFeedback({
          title: "Please speak first",
          message: "We didn't hear anything. Try saying the word aloud!",
          borderColor: "#6B7280",
          textColor: "#6B7280",
          bgColor: "#E5E7EB",
        });
      }
    }
  };

  const renderDyslexiaTrackedSentence = () => {
    if (!currentWord) return null;
    const originalWordsArray = currentWord.split(/\s+/);
    const spokenCleanedArray = cleanWordString(spokenText).split(/\s+/).filter(Boolean);

    return (
      <View style={customStyles.trackedContainer}>
        {originalWordsArray.map((w: string, i: number) => {
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
              <View style={customStyles.visualBox}>
                {renderDyslexiaTrackedSentence()}
                {lastAccuracy > 0 && (
                  <Text style={customStyles.accuracyText}>
                    Accuracy: {lastAccuracy}%
                  </Text>
                )}
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
                isSentenceCorrect={isSentenceCorrect}
                onSpeechResult={handleProcessMimoSpeech}
                onNextWord={isSentenceCorrect ? goToNextWord : () => {}}
                onClearFeedback={clearFeedbackForRetry}
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
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContainer}
        >
          {/* Learn Progress strip — replaces the old single-line debug bar */}
          <View style={s.learnCard}>
            <View style={s.learnCardHeader}>
              <Text style={s.learnCardTitle}>LEARN PROGRESS</Text>
              <View style={s.learnCardHeaderRight}>
                <Text style={s.learnCardCount}>
                  {learnLevelsCompletedCount} of {LEARN_LEVEL_KEYS.length} done
                </Text>
                <TouchableOpacity
                  style={s.debugIconBtn}
                  onPress={() => debugCompleteLearnModule(activeLevelKey)}
                >
                  <Wrench size={13} color="#6B9EC8" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={s.learnLevelRow}>
              {LEARN_LEVEL_KEYS.map((key, idx) => {
                const done = !!learnStatus[key];
                return (
                  <View key={key} style={s.learnLevelCol}>
                    <View style={[s.learnLevelDot, done && s.learnLevelDotDone]}>
                      {done ? (
                        <Check size={14} color="#fff" />
                      ) : (
                        <Text style={s.learnLevelDotText}>{idx + 1}</Text>
                      )}
                    </View>
                    <Text style={[s.learnLevelLabel, done && s.learnLevelLabelDone]}>
                      L{idx + 1}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <Text style={s.pageTitle}>Practice Sessions</Text>

          {/* Difficulty list */}
          {/* Difficulty grid */}
<View style={s.card}>
  <Text style={s.cardTitle}>DIFFICULTY LEVEL</Text>
  <View style={s.diffRow}>
    {DIFFICULTIES.map((d) => {
      const isActive = activeLevelKey === d.id;
      const unlocked = isLearnGatePassed(d.id);
      const levelProgress = allPracticeProgress[d.id] || {
        completed: 0,
        lastIndex: 0,
      };
      const completedCount = Math.min(levelProgress.completed, d.words);

      return (
        <TouchableOpacity
          key={d.id}
          onPress={() => handleSelectDifficulty(d)}
          activeOpacity={unlocked ? 0.75 : 1}
          disabled={!unlocked}
          style={[
            s.diffCard,
            isActive && unlocked && s.diffCardActive,
            !unlocked && s.diffCardLocked,
          ]}
        >
          <View
            style={[
              s.diffIconBadge,
              isActive && unlocked && s.diffIconBadgeActive,
              !unlocked && s.diffIconBadgeLocked,
            ]}
          >
            {unlocked ? (
              <d.icon size={18} color={isActive ? "#fff" : "#2563EB"} />
            ) : (
              <Lock size={16} color="#94A3B8" />
            )}
          </View>

          <Text
            style={[
              s.diffCardName,
              isActive && unlocked && s.diffCardNameActive,
              !unlocked && s.diffCardNameLocked,
            ]}
            numberOfLines={1}
          >
            {d.label}
          </Text>

          {unlocked ? (
            <>
              <ProgressBar
                completed={completedCount}
                total={d.words}
                label={null}
                fillColor={isActive ? "#BFDBFE" : "#2563EB"}
                trackColor={isActive ? "rgba(255,255,255,0.35)" : "#DBEAFE"}
                height={5}
              />
              <Text
                style={[s.diffCardCount, isActive && s.diffCardCountActive]}
              >
                {completedCount}/{d.words}
              </Text>
            </>
          ) : (
            <Text style={s.diffCardLockReason} numberOfLines={3}>
              {getLockMessage(d.id)}
            </Text>
          )}
        </TouchableOpacity>
      );
    })}
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
            {LESSON_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                onPress={() => handleFeatureRowPress(item.id)}
                style={s.pRow}
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
    color: "#16A34A",
    textDecorationLine: "underline",
  },
  wordMissed: {
    color: "#EF4444",
  },
  accuracyText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "700",
    color: "#2563EB",
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
    marginTop: 4,
  },

  // Learn Progress card (replaces old debugHud)
  learnCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    paddingVertical: 10,        // was: padding: 14
    paddingHorizontal: 14,
    marginBottom: 14,
    marginTop: 8,
  },
  learnCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  learnCardTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B9EC8",
    letterSpacing: 0.5,
  },
  learnCardHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  learnCardCount: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2563EB",
  },
  debugIconBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  learnLevelRow: {
    flexDirection: "row",
    gap: 6,
  },
  learnLevelCol: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  learnLevelDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#EFF6FF",
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
  },
  learnLevelDotDone: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  learnLevelDotText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
  learnLevelLabel: {
    fontSize: 9,
    fontWeight: "500",
    color: "#94A3B8",
  },
  learnLevelLabelDone: {
    color: "#1E3A5F",
    fontWeight: "700",
  },

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

  // Difficulty list (stacked rows, replaces the old 3-column grid)
  diffRow: {
    flexDirection: "row",
    gap: 8,
  },
  diffCard: {
    flex: 1,
    alignItems: "center",
     paddingVertical: 6,      // was: padding: 12
    paddingHorizontal: 6,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  diffCardActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  diffCardLocked: {
    opacity: 0.85,
  },
  diffIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },
  diffIconBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  diffIconBadgeLocked: {
    backgroundColor: "#EEF2F6",
  },
  diffCardName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E3A5F",
    textAlign: "center",
    marginBottom: 3,
  },
  diffCardNameActive: { color: "#fff" },
  diffCardNameLocked: { color: "#94A3B8" },
  diffCardCount: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6B9EC8",
    marginTop: 4,
    textAlign: "center",
  },
  diffCardCountActive: { color: "#fff" },
  diffCardLockReason: {
    fontSize: 9,
    color: "#B0B8C1",
    textAlign: "center",
    marginTop: 2,
    lineHeight: 12,
  },
  pRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 8,
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