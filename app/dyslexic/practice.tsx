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
  Zap
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

// -----------------------------------------------------------------------------
// NEW: pulled out of the old selectedLevelData useMemo so it can be reused
// for ALL THREE levels (needed to compute the combined 4-module total for
// each difficulty card, not just the currently active level).
// -----------------------------------------------------------------------------
const resolveLevelModules = (rawLevelRoot: any) => {
  if (!rawLevelRoot) {
    return { simpleWords: [], syllableBasics: [], letterRecognition: [], readAloud: [] };
  }

  const searchTargets = [
    rawLevelRoot.lessons,
    rawLevelRoot.lessonPractice,
    rawLevelRoot.BEGINNER_LESSON_DATA,
    rawLevelRoot.INTERMEDIATE_LESSON_DATA,
    rawLevelRoot.ADVANCED_LESSON_DATA,
    rawLevelRoot.default,
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

  if (finalSimpleWords.length === 0 && rawLevelRoot.lessons) {
    const nested = rawLevelRoot.lessons;
    finalSimpleWords = nested?.simpleWords || [];
    finalSyllableBasics = nested?.syllableBasics || [];
    finalLetterRec = nested?.letterRecognition || [];
  }

  const readAloud = rawLevelRoot.readAloud || [];

  return {
    simpleWords: finalSimpleWords,
    syllableBasics: finalSyllableBasics,
    letterRecognition: finalLetterRec,
    readAloud,
  };
};

export default function DyslexicPractice() {
  const {
    currentLevel,
    setCurrentLevel,
    isLearnGatePassed,
    getLockMessage,
    updatePracticeProgress, 
    practiceProgress,       
    lessonCompletions,      
    refreshProgress,
    getPracticeProgress,
    getLevelCompletedCount,
    isLearnLevelComplete,
  } = useAppProgress();

  // Backward compatibility alias so existing references to learnStatus won't crash
  const learnStatus = lessonCompletions;

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

  // UPDATED: now just calls the shared helper instead of duplicating the
  // search-target logic inline.
  const selectedLevelData = useMemo(() => {
    if (!rawLevelRoot) return null;
    const modules = resolveLevelModules(rawLevelRoot);
    return {
      ...rawLevelRoot,
      ...modules,
    };
  }, [rawLevelRoot]);

  useEffect(() => {
    setSpokenText("");
    setIsSentenceCorrect(false);
    setLastAccuracy(0);
    setMimoFeedback(null);
  }, [currentLevel, activeLessonGame]);

  useEffect(() => {
    const total = selectedLevelData?.readAloud?.length || 0;
    const readAloudRecord = getPracticeProgress(activeLevelKey, "Read Aloud");
    const resumeIndex = total > 0 ? Math.min((readAloudRecord.current_question || 1) - 1, total - 1) : 0;
    setWordIndex(resumeIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLevel, activeLevelKey, selectedLevelData]);

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
  
   
  // 1. When loading the screen, fetch where the user left off:
const currentLevelName = "beginner"; // or dynamic state
const practiceModuleName = "letter_recognition"; // matches PRACTICE_MODULE_TYPES

const savedProgress = getPracticeProgress(currentLevelName, practiceModuleName);
const [currentIndex, setCurrentIndex] = useState(savedProgress.current_question - 1);

// 2. Whenever the user moves to the next question, save progress immediately:
const handleNextQuestion = async (nextIndex: number, isCompleted: boolean) => {
  setCurrentIndex(nextIndex);
  
  // Save to Supabase + local hook state via upsert
  await updatePracticeProgress(
    currentLevelName,
    practiceModuleName,
    nextIndex + 1, // Store 1-based question number
    isCompleted,
    currentScore
  );
};

  // -----------------------------------------------------------------------------
  // UPDATED: `words` is now the SUM of all 4 modules (Letter Recognition +
  // Simple Words + Phonics Basics + Read Aloud) for that level, not just
  // readAloud.length. This is what makes the card show e.g. 0/80 instead of
  // 0/20, and lets the percentage reflect true overall level completion.
  // -----------------------------------------------------------------------------
  const DIFFICULTIES = useMemo(() => {
    const buildLevelMeta = (
      id: "beginner" | "intermediate" | "advanced",
      label: string,
      icon: any,
      fallbackTotal: number
    ) => {
      const modules = resolveLevelModules(PRACTICE_DATA_MATRIX[id]);
      const totalQuestions =
        modules.letterRecognition.length +
        modules.simpleWords.length +
        modules.syllableBasics.length +
        modules.readAloud.length;

      return {
        id,
        label,
        icon,
        words: totalQuestions > 0 ? totalQuestions : fallbackTotal,
      };
    };

    return [
      buildLevelMeta("beginner", "Beginner", Sprout, 80),       // 20 x 4 modules
      buildLevelMeta("intermediate", "Intermediate", Flame, 120), // 30 x 4 modules
      buildLevelMeta("advanced", "Advanced", Zap, 160),           // 40 x 4 modules
    ];
  }, []);

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
    () => LEARN_LEVEL_KEYS.filter((key) => isLearnLevelComplete(key)).length,
    [isLearnLevelComplete]
  );

  const handleSelectDifficulty = (diff: (typeof DIFFICULTIES)[0]) => {
    if (!isLearnGatePassed(diff.id)) return;
    setCurrentLevel(diff.id);
  };

  const handleFeatureRowPress = (featureId: string) => {
    if (!isLearnGatePassed(activeLevelKey)) return;
    setActiveLessonGame(featureId);
  };
  

// To this:
const handleGameComplete = () => {
  let practiceTypeStr = "Letter Recognition";
  if (activeLessonGame === "SIMPLE_WORDS") practiceTypeStr = "Simple Words";
  if (activeLessonGame === "PHONICS_BASICS") practiceTypeStr = "Phonics Basics";
  if (activeLessonGame === "READ_ALOUD") practiceTypeStr = "Read Aloud";

  // NEW: onComplete only ever fires once every question in the module has
  // been answered, so the true "finished" question count is the module's
  // actual length — not a guess derived from whatever current_question was
  // when the screen was opened.
  const moduleLength =
    (selectedLevelData?.letterRecognition?.length && practiceTypeStr === "Letter Recognition"
      ? selectedLevelData.letterRecognition.length
      : practiceTypeStr === "Simple Words"
      ? selectedLevelData?.simpleWords?.length || 0
      : practiceTypeStr === "Phonics Basics"
      ? selectedLevelData?.syllableBasics?.length || 0
      : selectedLevelData?.readAloud?.length || 0) || 0;

  // NEW: read progress fresh right now instead of trusting a value that
  // may have been captured before the game session started.
  const currentRecord = getPracticeProgress(activeLevelKey, practiceTypeStr);

  updatePracticeProgress(
    activeLevelKey,
    practiceTypeStr,
    moduleLength + 1,
    true,
    currentRecord.score
  );

  setActiveLessonGame(null);
};

  const goToNextWord = () => {
    if (totalReadAloudItems === 0) return;
    const nextIndex = wordIndex < totalReadAloudItems - 1 ? wordIndex + 1 : 0;
    setWordIndex(nextIndex);
    
    updatePracticeProgress(
      activeLevelKey,
      "Read Aloud",
      nextIndex + 1,
      nextIndex === 0,
      lastAccuracy
    );

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

      updatePracticeProgress(
        activeLevelKey,
        "Read Aloud",
        wordIndex + 1,
        true,
        accuracy
      );
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
    const letterRecProgress = getPracticeProgress(activeLevelKey, "Letter Recognition");
    // TODO: LetterRecognitionGame's Props type doesn't declare
    // initialQuestionIndex / onProgress yet, so we pass them through an
    // `as any` bridge below to avoid a TS2322 build error. Once
    // LetterRecognitionGame.tsx is updated to accept these two props
    // (resume index + per-question progress callback), this can become a
    // normal typed prop and the cast can be removed.
    // LETTER_RECOGNITION block — change this:
const letterRecResumeProps: any = {
  initialQuestionIndex: Math.max((letterRecProgress.current_question || 1) - 1, 0),
  onProgress: (questionIndex: number) =>
    updatePracticeProgress(
      activeLevelKey,
      "Letter Recognition",
      questionIndex + 1,
      false,
      letterRecProgress.score
    ),
};
return (
  <LetterRecognitionGame
    level={activeLevelKey}
    data={selectedLevelData as any}
    {...letterRecResumeProps}
    onComplete={handleGameComplete}
    onClose={() => setActiveLessonGame(null)}
  />
);

// to this (drop the `: any` bridge, pass props directly — now typed):
return (
  <LetterRecognitionGame
    level={activeLevelKey}
    data={selectedLevelData as any}
    initialQuestionIndex={Math.max((letterRecProgress.current_question || 1) - 1, 0)}
    onProgress={(questionIndex: number) =>
      updatePracticeProgress(
        activeLevelKey,
        "Letter Recognition",
        questionIndex + 1,
        false,
        letterRecProgress.score
      )
    }
    onComplete={handleGameComplete}
    onClose={() => setActiveLessonGame(null)}
  />
);
}

  if (activeLessonGame === "SIMPLE_WORDS") {
    const simpleWordsProgress = getPracticeProgress(activeLevelKey, "Simple Words");
    // TODO: same as the note above — SimpleWordsGame's Props type doesn't
    // declare these two yet, so pass through an `as any` bridge for now.
    const simpleWordsResumeProps: any = {
      initialQuestionIndex: Math.max((simpleWordsProgress.current_question || 1) - 1, 0),
      onProgress: (questionIndex: number) =>
        updatePracticeProgress(
          activeLevelKey,
          "Simple Words",
          questionIndex + 1,
          false,
          simpleWordsProgress.score
        ),
    };
    return (
      <SimpleWordsGame
        level={activeLevelKey}
        data={selectedLevelData as any}
        {...simpleWordsResumeProps}
        onComplete={handleGameComplete}
        onClose={() => setActiveLessonGame(null)}
      />
    );
  }

  if (activeLessonGame === "PHONICS_BASICS") {
    const phonicsProgress = getPracticeProgress(activeLevelKey, "Phonics Basics");
    // TODO: same as the notes above — SyllableBasicsGame's Props type doesn't
    // declare these two yet, so pass through an `as any` bridge for now.
    const phonicsResumeProps: any = {
      initialQuestionIndex: Math.max((phonicsProgress.current_question || 1) - 1, 0),
      onProgress: (questionIndex: number) =>
        updatePracticeProgress(
          activeLevelKey,
          "Phonics Basics",
          questionIndex + 1,
          false,
          phonicsProgress.score
        ),
    };
    return (
      <SyllableBasicsGame
        level={activeLevelKey}
        data={selectedLevelData as any}
        {...phonicsResumeProps}
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
          {/* Learn Progress strip */}
          <View style={s.learnCard}>
            <View style={s.learnCardHeader}>
              <Text style={s.learnCardTitle}>LEARN PROGRESS</Text>
              <View style={s.learnCardHeaderRight}>
                <Text style={s.learnCardCount}>
                  {learnLevelsCompletedCount} of {LEARN_LEVEL_KEYS.length} done
                </Text>
              </View>
            </View>
            <View style={s.learnLevelRow}>
              {LEARN_LEVEL_KEYS.map((key, idx) => {
                const done = isLearnLevelComplete(key);
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

          {/* Difficulty grid */}
          <View style={s.card}>
            <Text style={s.cardTitle}>DIFFICULTY LEVEL</Text>
            <View style={s.diffRow}>
              {DIFFICULTIES.map((d) => {
                const isActive = activeLevelKey === d.id;
                const unlocked = isLearnGatePassed(d.id);

                const completedCount = Math.min(getLevelCompletedCount(d.id), d.words);
                // NEW: percentage across all 4 modules combined
                const percent =
                  d.words > 0 ? Math.round((completedCount / d.words) * 100) : 0;

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
                        {/* UPDATED: now shows completed/total AND percent, e.g. "0/80 • 0%" */}
                        <Text
                          style={[s.diffCardCount, isActive && s.diffCardCountActive]}
                        >
                          {completedCount}/{d.words} • {percent}%
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

  learnCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    paddingVertical: 10,
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

  diffRow: {
    flexDirection: "row",
    gap: 8,
  },
  diffCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
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
