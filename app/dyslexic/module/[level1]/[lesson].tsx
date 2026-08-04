import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Href, useLocalSearchParams, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";
import DragDropCard from "../../../../components/lesson/Dragdropcard";
import ExplanationVisual from "../../../../components/lesson/ExplanationVisual";
import { Mascot } from "../../../../components/lesson/Mascot";
import TapToRevealCard from "../../../../components/lesson/TapToRevealCard";
import TraceActivity from "../../../../components/lesson/TraceActivity";
import letterReversal from "../../../../data/level1/easy/letter_reversal";
import phonics from "../../../../data/level1/easy/phonics";
import vowel_processing from "../../../../data/level1/easy/vowel_processing";
import chunking from "../../../../data/level1/medium/chunking";
import decoding from "../../../../data/level1/medium/decoding";
import level2LetterReversal from "../../../../data/level2/easy/letter_reversal";
import level2Phonics from "../../../../data/level2/easy/phonics";
import level2VisualTracking from "../../../../data/level2/easy/vowel_processing";
import level2chunking from "../../../../data/level2/medium/chunking";
import level2decoding from "../../../../data/level2/medium/decoding";
import level3LetterReversal from "../../../../data/level3/easy/letter_reversal";
import level3Phonics from "../../../../data/level3/easy/phonics";
import level3VowelProcessing from "../../../../data/level3/easy/vowel_processing";
import level3chunkining from "../../../../data/level3/medium/chunking";
import level3decoding from "../../../../data/level3/medium/decoding";
import level4MixedMastery from "../../../../data/level4/Level4_mixed_mastery";
import level5Test from "../../../../data/level5/test";
import { useAuth } from "../../../../hooks/AuthProvider"; // ← adjust path to wherever your session lives
import {
  getCurrentProgress,
  getLatestAssessment,
  markLevelCompleted,
  saveCurrentProgress,
  upsertLessonProgress,
} from "../../../../utils/progress";
import {
  buildUrls,
  getHostUriIp,
  resolveServerIp,
  setServerIpOverride,
} from "../../../../utils/serverConfig";
const curriculumMap: Record<string, Record<string, any>> = {
  level1: {
    letter_reversal: letterReversal,
    phonics: phonics,
    vowel_processing: vowel_processing,
    chunking: chunking,
    decoding: decoding,
  },
  level2: {
    letter_reversal: level2LetterReversal,
    phonics: level2Phonics,
    vowel_processing: level2VisualTracking,
    chunking: level2chunking,
    decoding: level2decoding,
  },
  level3: {
    letter_reversal: level3LetterReversal,
    phonics: level3Phonics,
    vowel_processing: level3VowelProcessing,
    chunking: level3chunkining,
    decoding: level3decoding,
  },
  level4: {
    mixed_mastery: level4MixedMastery,
  },
  level5: {
    test: level5Test,
  },
};

const LEVEL_ORDER = ["level1", "level2", "level3", "level4", "level5"];

function getNextRoute(currentLevel: string, lessonKey: string): Href | null {
  const levelIdx = LEVEL_ORDER.indexOf(currentLevel);
  const nextLevel = LEVEL_ORDER[levelIdx + 1];
  if (!nextLevel) return null;

  const nextLevelLessons = curriculumMap[nextLevel];
  if (!nextLevelLessons) return null;

  const nextLessonKey = nextLevelLessons[lessonKey]
    ? lessonKey
    : Object.keys(nextLevelLessons)[0];

  return {
    pathname: "/dyslexic/module/[level1]/[lesson]",
    params: { level1: nextLevel, lesson: nextLessonKey },
  };
}
type MascotConfig = {
  mood: "cheer" | "correct" | "wrong" | "encourage" | "frustrated";
  message: string;
  displayMode: "toast" | "modal";
};

export default function LessonScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const frameInterval = useRef<NodeJS.Timeout | null>(null);
  const confettiRef = useRef<any>(null);
  const hasGreetedRef = useRef(false);
  const [pendingWordHelp, setPendingWordHelp] = useState<{
    word: string;
    hyphenated: string;
  } | null>(null);
  const [completionReady, setCompletionReady] = useState(false);

  const { session } = useAuth();
  const { lesson, level1 } = useLocalSearchParams();
  const [step, setStep] = useState(0);
  const lessonKey = Array.isArray(lesson) ? lesson[0] : lesson;
  const activeLevel = Array.isArray(level1) ? level1[0] : level1;

  const [resolvedLevel, setResolvedLevel] = useState<string | null>(null);
  const [resolvedLessonKey, setResolvedLessonKey] = useState<string | null>(
    null,
  );
  const lessonData =
    curriculumMap[resolvedLevel ?? ""]?.[resolvedLessonKey ?? ""] ??
    letterReversal;
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [mascotConfig, setMascotConfig] = useState<MascotConfig | null>(null);

  const ws = useRef<any>(null);
  const distractionTimer = useRef<any>(null);
  const reconnectTimer = useRef<any>(null);
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

  const explanationLength = lessonData.explanation?.length || 0;
  const examplesLength = lessonData.examples?.length || 0;
  const totalSteps =
    explanationLength +
    examplesLength +
    (lessonData.guidedPractice?.length || 0);
  const currentPractice =
    lessonData.guidedPractice?.[step - explanationLength - examplesLength];

  const [serverIp, setServerIp] = useState<string | null>(null);
  const [ipModalVisible, setIpModalVisible] = useState(false);
  const [ipInput, setIpInput] = useState("");
  const [wsStatus, setWsStatus] = useState<
    "connecting" | "connected" | "disconnected" | "unconfigured"
  >("connecting");

  useEffect(() => {
    (async () => {
      const { granted } = await requestPermission();
      if (!granted) console.warn("Camera permission denied.");
    })();
  }, []);
  useEffect(() => {
    setFinished(false);
    setScore(0);
    setMascotConfig(null);
    setPendingWordHelp(null);
  }, [activeLevel, lessonKey]);
  useEffect(() => {
    if (!session?.user?.id) return;

    (async () => {
      if (lessonKey && activeLevel) {
        setResolvedLevel(activeLevel);
        setResolvedLessonKey(lessonKey as string);

        if (!hasGreetedRef.current) {
          hasGreetedRef.current = true;
          const topic = (lessonKey as string).replace("_", " ");
          Speech.speak(`Welcome back! Let's keep going with ${topic}.`, {
            language: "en",
            pitch: 1,
            rate: 0.85,
          });
        }
        return;
      }

      const progress = await getCurrentProgress(session.user.id);
      if (progress?.current_level && progress?.current_lesson) {
        setResolvedLevel(progress.current_level);
        setResolvedLessonKey(progress.current_lesson);
        return;
      }

      const assessment = await getLatestAssessment(session.user.id);
      if (!assessment) {
        router.replace("/dyslexic/welcome");
        return;
      }

      const startLevel = assessment.level ?? "level1";
      const startLesson = assessment.weak_area ?? "letter_reversal";

      setResolvedLevel(startLevel);
      setResolvedLessonKey(startLesson);

      await saveCurrentProgress(session.user.id, startLevel, startLesson);

      if (!hasGreetedRef.current) {
        hasGreetedRef.current = true;
        const topic = startLesson.replace("_", " ");
        Speech.speak(`Welcome back! Let's keep working on ${topic} together.`, {
          language: "en",
          pitch: 1,
          rate: 0.85,
        });
      }
    })();
  }, [session?.user?.id, activeLevel, lessonKey]);
  useEffect(() => {
    if (!resolvedLevel || !resolvedLessonKey || !session?.user?.id) return;
    (async () => {
      const progress = await getCurrentProgress(session.user.id);
      if (!progress?.current_level) return;

      const requestedIdx = LEVEL_ORDER.indexOf(resolvedLevel);
      const currentIdx = LEVEL_ORDER.indexOf(progress.current_level);
      const completedLevels: string[] = progress.completed_levels ?? [];

      if (
        requestedIdx !== -1 &&
        currentIdx !== -1 &&
        requestedIdx < currentIdx &&
        completedLevels.includes(resolvedLevel)
      ) {
        Speech.speak(
          "You already finished this level! Continuing where you left off.",
          {
            rate: 0.85,
          },
        );
        router.replace({
          pathname: "/dyslexic/module/[level1]/[lesson]",
          params: {
            level1: progress.current_level,
            lesson: progress.current_lesson ?? resolvedLessonKey,
          },
        } as any);
      }
    })();
  }, [resolvedLevel, resolvedLessonKey, session?.user?.id]);

  useEffect(() => {
    (async () => {
      const ip = await resolveServerIp();
      if (!ip) {
        setWsStatus("unconfigured");
        setIpModalVisible(true);
      } else {
        setServerIp(ip);
      }
    })();
  }, []);
  // restore step once lesson is resolved
  useEffect(() => {
    if (!resolvedLevel || !resolvedLessonKey) return;
    (async () => {
      const key = `zyralex:step:${resolvedLevel}:${resolvedLessonKey}`;
      const saved = await AsyncStorage.getItem(key);
      setStep(saved ? Number(saved) : 0);
    })();
  }, [resolvedLevel, resolvedLessonKey]);

  // persist step as it changes
  useEffect(() => {
    if (!resolvedLevel || !resolvedLessonKey) return;
    const key = `zyralex:step:${resolvedLevel}:${resolvedLessonKey}`;
    AsyncStorage.setItem(key, String(step));
  }, [step, resolvedLevel, resolvedLessonKey]);
  // restore the "lesson finished, awaiting decision" screen if user left mid-decision
  useEffect(() => {
    if (!resolvedLevel || !resolvedLessonKey) return;
    (async () => {
      const key = `zyralex:completed:${resolvedLevel}:${resolvedLessonKey}`;
      const saved = await AsyncStorage.getItem(key);
      if (!saved) return;

      const parsed = JSON.parse(saved);
      setScore(parsed.score ?? 0);
      setFinished(true);
      setCompletionReady(true);
      setMascotConfig({
        mood: "cheer",
        message: `🎉 You finished the lesson!\n\nScore: ${parsed.score} / ${lessonData.guidedPractice?.length ?? 0}\n\nYou're on a roll — want to jump into the next lesson, or take a well-earned break and come back later?`,
        displayMode: "modal",
      });
    })();
  }, [resolvedLevel, resolvedLessonKey]);

  const saveIpOverride = async () => {
    const trimmed = ipInput.trim();
    if (!trimmed) return;
    await setServerIpOverride(trimmed);
    setServerIp(trimmed);
    setIpModalVisible(false);
  };

  useEffect(() => {
    if (!serverIp) return;

    const { base: BASE_IP_URL, ws: WS_IP_URL } = buildUrls(serverIp);
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      setWsStatus("connecting");

      fetch(`${BASE_IP_URL}/api/tracking/start`, { method: "POST" }).catch(
        (err) => console.error("Tracking start failed:", err),
      );

      const socket = new WebSocket(WS_IP_URL);
      ws.current = socket;

      socket.onopen = () => {
        if (cancelled) return;
        console.log("Connected to ZyraLex Server");
        setWsStatus("connected");
        sendCurrentWordsToTracker();
      };

      socket.onerror = () => {
        if (cancelled) return;
        setWsStatus("disconnected");
      };

      socket.onclose = () => {
        if (cancelled) return;
        setWsStatus("disconnected");
        reconnectTimer.current = setTimeout(connect, 4000);
      };

      socket.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);

          if (response.type === "DISTRACTION_ALERT") {
            if (distractionTimer.current)
              clearTimeout(distractionTimer.current);
            const alertMessage =
              response.sel_message ||
              "Hey! Lost your place? It is completely normal to take a rest but don't quit, you got this!!";
            setMascotConfig({
              mood: "encourage",
              message: alertMessage,
              displayMode: "toast",
            });
            Speech.speak(alertMessage, {
              language: "en",
              pitch: 0.95,
              rate: 0.75,
            });
            distractionTimer.current = setTimeout(
              () => setMascotConfig(null),
              8000,
            );
          }

          if (response.type === "FRUSTRATION_ALERT") {
            if (distractionTimer.current)
              clearTimeout(distractionTimer.current);
            const frustrationMessage =
              response.sel_message ||
              "This word is tough — and you're still here trying. That's what matters! ";
            setMascotConfig({
              mood: "frustrated",
              message: frustrationMessage,

              displayMode: "toast",
            });
            Speech.speak(frustrationMessage, {
              language: "en",
              pitch: 0.95,
              rate: 0.72,
            });
            distractionTimer.current = setTimeout(
              () => setMascotConfig(null),
              9000,
            );
          }

          if (response.type === "INTERVENTION_TRIGGER") {
            const interventionMessage = `${response.sel_message}\n\nDo you need help with the word "${response.word}"?`;
            setPendingWordHelp({
              word: response.word,
              hyphenated: response.adaptations.hyphenated,
            });
            setMascotConfig({
              mood: "encourage",
              message: interventionMessage,
              displayMode: "modal",
            });
            Speech.speak(interventionMessage.replace("\n\n", " "), {
              language: "en",
              pitch: 0.95,
              rate: 0.75,
            });
          }
        } catch (err) {
          console.error("Error parsing socket data:", err);
        }
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (distractionTimer.current) clearTimeout(distractionTimer.current);
      ws.current?.close();
    };
  }, [serverIp]);

  useEffect(() => {
    sendCurrentWordsToTracker();
  }, [step]);
  const sendCurrentWordsToTracker = () => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    let targetWords: string[] = [];
    let isExampleStep = false;
    let mainExampleWord = "";

    if (step < explanationLength) {
      targetWords = lessonData.explanation[step].content.split(" ");
    } else if (
      lessonData.examples &&
      step < explanationLength + examplesLength
    ) {
      isExampleStep = true;
      const example = lessonData.examples[step - explanationLength];
      mainExampleWord = example.word
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    } else if (currentPractice) {
      targetWords = currentPractice.question.split(" ");
    }

    let mappedScreenWords: Array<{
      word: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }> = [];

    if (isExampleStep && mainExampleWord) {
      mappedScreenWords = [
        {
          word: mainExampleWord,
          x1: 0,
          y1: 100,
          x2: screenWidth,
          y2: screenHeight - 200,
        },
      ];
    } else if (targetWords.length > 0) {
      const segmentWidth = screenWidth / Math.max(1, targetWords.length);
      mappedScreenWords = targetWords.map((word, index) => ({
        word: word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""),
        x1: index * segmentWidth,
        y1: 0,
        x2: (index + 1) * segmentWidth,
        y2: screenHeight,
      }));
    }

    if (mappedScreenWords.length > 0) {
      ws.current.send(JSON.stringify({ screen_words: mappedScreenWords }));
    }
  };

  const speakWord = (word: string) => {
    Speech.speak(word, { language: "en", pitch: 1, rate: 0.8 });
  };

  const handleNext = () => {
    if (step + 1 >= totalSteps) {
      setFinished(true);
      setCompletionReady(true);
      confettiRef.current?.start();
      setMascotConfig({
        mood: "cheer",
        message: `🎉 You finished the lesson!\n\nScore: ${score} / ${lessonData.guidedPractice?.length ?? 0}\n\nYou're on a roll — want to jump into the next lesson, or take a well-earned break and come back later?`,
        displayMode: "modal",
      });
      Speech.speak("Amazing work! Lesson complete!", { rate: 0.85 });

      if (resolvedLevel && resolvedLessonKey) {
        AsyncStorage.setItem(
          `zyralex:completed:${resolvedLevel}:${resolvedLessonKey}`,
          JSON.stringify({ score }),
        );
      }
    } else {
      setStep(step + 1);
    }
  };

  const handlePracticeAnswer = (selected: string, correct: string) => {
    if (selected === correct) {
      setScore((prev) => prev + 1);
      confettiRef.current?.start();
      setMascotConfig({
        mood: "correct",
        message: "Amazing! You got it right! Your hard work is paying off! ",
        displayMode: "modal",
      });
      Speech.speak("Amazing job!");
    } else {
      setMascotConfig({
        mood: "wrong",
        message:
          "That's okay! Mistakes help us learn. Try to sound it out next time. 💛",
        displayMode: "modal",
      });
      Speech.speak("Nice try! Keep going!");
    }
  };
  const advanceAndGoTo = async (destination: "next" | "practice" | "home") => {
    let leveledUp = false;
    let nextLevelLabel = "";

    try {
      if (session?.user?.id && resolvedLevel && resolvedLessonKey) {
        await upsertLessonProgress({
          userId: session.user.id,
          levelKey: resolvedLevel,
          lessonKey: resolvedLessonKey,
          completed: true,
          score,
        });

        if (destination !== "practice") {
          const nextRoute = getNextRoute(resolvedLevel, resolvedLessonKey);
          if (nextRoute) {
            const params = (nextRoute as any).params;
            if (params.level1 !== resolvedLevel) {
              leveledUp = true;
              nextLevelLabel = params.level1.replace("level", "Level ");
              await markLevelCompleted(session.user.id, resolvedLevel);
            }
            await saveCurrentProgress(
              session.user.id,
              params.level1,
              params.lesson,
            );
          }
        }
      }
    } catch (err) {
      console.warn("Progress save failed, navigating anyway:", err);
    }

    await AsyncStorage.removeItem(
      `zyralex:step:${resolvedLevel}:${resolvedLessonKey}`,
    );
    await AsyncStorage.removeItem(
      `zyralex:completed:${resolvedLevel}:${resolvedLessonKey}`,
    );

    setStep(0);
    setFinished(false);
    setScore(0);
    setMascotConfig(null);
    setCompletionReady(false);

    if (destination === "practice") {
      router.push({
        pathname: "/dyslexic/practice",
        params: { lesson: resolvedLessonKey, level: resolvedLevel },
      });
      return;
    }

    if (destination === "home") {
      Speech.speak(
        leveledUp
          ? `Yay! You finished this level! Next time, let's start ${nextLevelLabel}!`
          : "Great work today! See you next time.",
        { rate: 0.85 },
      );
      router.replace("/dyslexic");
      return;
    }

    const nextRoute = getNextRoute(
      resolvedLevel as string,
      resolvedLessonKey as string,
    );
    if (!nextRoute) {
      router.replace("/dyslexic");
      return;
    }
    if (leveledUp) {
      Speech.speak(`Yay! Let's start ${nextLevelLabel}!`, { rate: 0.85 });
    }
    router.replace(nextRoute);
  };

  const renderContent = () => {
    if (step < lessonData.explanation.length) {
      const item = lessonData.explanation[step];
      return (
        <View style={styles.card}>
          <View style={[styles.badge, item.type === "tip" && styles.tipBadge]}>
            <Text style={styles.badgeText}>{item.type.toUpperCase()}</Text>
          </View>
          <ExplanationVisual item={item} />

          <Text style={styles.text}>{item.content}</Text>
          {item.type === "activity" &&
            (() => {
              const contentString = item.content?.toLowerCase() || "";
              const isVocalActivity =
                contentString.includes("whisper") ||
                contentString.includes("say");

              if (isVocalActivity) {
                return (
                  <View
                    style={{
                      marginVertical: 16,
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <TouchableOpacity
                      style={[
                        styles.button,
                        {
                          backgroundColor: "#10B981",
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 10,
                          width: "100%",
                          paddingVertical: 16,
                        },
                      ]}
                      onPress={() => {
                        speakWord(item.content);
                        router.push({
                          pathname: "/dyslexic/practice",
                          params: {
                            lesson: lessonKey,
                            level: activeLevel,
                            anchor: item.visualAnchor,
                          },
                        });
                      }}
                    >
                      <Ionicons name="mic-circle" size={26} color="white" />
                      <Text style={styles.buttonText}>
                        Tap to Practice with Mimo! 🐼
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              }

              return <TraceActivity letter={item.visualAnchor || "A"} />;
            })()}

          <TouchableOpacity
            style={styles.button}
            onPress={() => speakWord(item.content)}
          >
            <View style={styles.audioRow}>
              <Ionicons name="volume-high" size={20} color="#fff" />
              <Text style={styles.buttonText}>Hear It</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { marginTop: 14 }]}
            onPress={handleNext}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (lessonData.examples && step < explanationLength + examplesLength) {
      const exampleIndex = step - explanationLength;
      const example = lessonData.examples[exampleIndex];

      const prefix = example.letter || example.chunk || "";

      return (
        <View style={styles.card}>
          <Text style={styles.bigLetter}>{example.emoji}</Text>
          <Text style={styles.word}>
            {prefix ? (
              <>
                <Text
                  style={{
                    color: example.color || "#2563EB",
                    fontWeight: "bold",
                  }}
                >
                  {prefix}
                </Text>
                {example.word.slice(prefix.length)}
              </>
            ) : (
              <Text>{example.word}</Text>
            )}
          </Text>
          {example.sentence && (
            <Text style={styles.exampleSentence}>{example.sentence}</Text>
          )}
          <TouchableOpacity
            style={styles.audioButton}
            onPress={() => speakWord(example.word)}
          >
            <Ionicons name="volume-high" size={20} color="#2563EB" />
            <Text style={styles.audioText}>Hear Sound</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>I Understand</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (lessonData.guidedPractice && currentPractice) {
      if (currentPractice.interactionType === "tap-to-reveal") {
        return (
          <TapToRevealCard
            practice={currentPractice}
            onAnswer={handlePracticeAnswer}
            onSpeak={speakWord}
            variant={lessonKey === "letter_reversal" ? "mirror-flip" : "pop"}
          />
        );
      }
      if (currentPractice.interactionType === "drag-and-drop") {
        return (
          <DragDropCard
            practice={currentPractice}
            onAnswer={handlePracticeAnswer}
            onSpeak={speakWord}
          />
        );
      }
      return (
        <View style={styles.card}>
          <Text style={styles.question}>{currentPractice.question}</Text>
          {currentPractice.options.map((option: string, index: number) => (
            <TouchableOpacity
              key={index}
              style={styles.option}
              onPress={() =>
                handlePracticeAnswer(option, currentPractice.answer)
              }
            >
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    return null;
  };

  const wsBadgeColor =
    wsStatus === "connected"
      ? "#22c55e"
      : wsStatus === "connecting"
        ? "#f59e0b"
        : "#ef4444";

  return (
    <View style={styles.screenContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity
          onPress={() => {
            setIpInput(serverIp ?? "");
            setIpModalVisible(true);
          }}
        >
          <Text style={[styles.wsBadge, { backgroundColor: wsBadgeColor }]}>
            WS: {wsStatus}
            {serverIp ? ` (${serverIp})` : ""}
          </Text>
        </TouchableOpacity>

        <Text style={styles.title}>{lessonData.title}</Text>
        <Text style={styles.subtitle}>{lessonData.subtitle}</Text>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${((step + 1) / totalSteps) * 100}%` },
            ]}
          />
        </View>
        {!finished ? (
          <Animated.View
            key={step}
            entering={FadeInRight.duration(350)}
            exiting={FadeOutLeft.duration(200)}
          >
            {renderContent()}
          </Animated.View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.complete}>{lessonData.completionMessage}</Text>
            <Text style={styles.score}>
              Score: {score} / {lessonData.guidedPractice.length}
            </Text>
            <TouchableOpacity
              style={[
                styles.button,
                { marginTop: 24, backgroundColor: "#2563EB" },
              ]}
              onPress={() => advanceAndGoTo("next")}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Ambient nudges (distraction / frustration): same toast placement for both. */}
      {mascotConfig && mascotConfig.displayMode === "toast" ? (
        <View style={styles.distractionToast}>
          <Image
            source={require("../../../../assets/mimoimg.png")}
            style={styles.toastMimo}
            resizeMode="contain"
          />
          <View style={styles.toastTextBlock}>
            <Text style={styles.toastTitle}>Hey!</Text>
            <Text style={styles.distractionText}>{mascotConfig.message}</Text>
          </View>
        </View>
      ) : mascotConfig ? (
        // Anything needing a decision or explicit dismissal: blocking modal.
        <View style={StyleSheet.absoluteFillObject}>
          <Mascot
            mood={mascotConfig.mood}
            message={mascotConfig.message}
            showNext={!pendingWordHelp && !completionReady}
            nextLabel="Got it!"
            onDismiss={() => {
              const isLockMessage =
                mascotConfig?.message?.includes("before unlocking");
              setMascotConfig(null);
              setPendingWordHelp(null);

              if (isLockMessage) {
                getCurrentProgress(session!.user!.id).then((progress) => {
                  router.replace({
                    pathname: "/dyslexic/module/[level1]/[lesson]",
                    params: {
                      level1: progress?.current_level ?? "level1",
                      lesson: progress?.current_lesson ?? "letter_reversal",
                    },
                  } as any);
                });
                return;
              }

              if (
                !completionReady &&
                (mascotConfig?.mood === "correct" ||
                  mascotConfig?.mood === "wrong")
              ) {
                handleNext();
              }
            }}
          />

          {completionReady && !pendingWordHelp && (
            <View style={[styles.wordHelpButtons, { flexWrap: "wrap" }]}>
              <TouchableOpacity
                style={styles.yesButton}
                onPress={() => advanceAndGoTo("next")}
              >
                <Text style={styles.yesText}>Next Lesson →</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.noButton, { backgroundColor: "#DBEAFE" }]}
                onPress={() => advanceAndGoTo("practice")}
              >
                <Text style={[styles.yesText, { color: "#2563EB" }]}>
                  Practice Now
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.noButton}
                onPress={() => advanceAndGoTo("home")}
              >
                <Text style={styles.noText}>Rest for now</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : null}

      <ConfettiCannon
        ref={confettiRef}
        count={120}
        origin={{ x: screenWidth / 2, y: 0 }}
        autoStart={false}
        fadeOut={true}
      />

      <Modal visible={ipModalVisible} transparent animationType="fade">
        <View style={styles.ipModalOverlay}>
          <View style={styles.ipModalCard}>
            <Text style={styles.ipModalTitle}>Server IP</Text>
            <Text style={styles.ipModalHint}>
              Enter the IP your FastAPI server (server.py) is running on, e.g.
              192.168.1.42. This is saved on this device so you only need to set
              it once per network.
            </Text>
            <TextInput
              value={ipInput}
              onChangeText={setIpInput}
              placeholder="192.168.1.42"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="numbers-and-punctuation"
              style={styles.ipInput}
            />
            <View style={styles.ipModalButtons}>
              {serverIp && (
                <TouchableOpacity
                  style={styles.ipCancelButton}
                  onPress={() => {
                    const detected = getHostUriIp();
                    if (detected) setIpInput(detected);
                  }}
                >
                  <Text style={styles.noText}>Auto-detect</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.ipSaveButton}
                onPress={saveIpOverride}
              >
                <Text style={styles.yesText}>Save & Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
  },
  // wsBadge: {
  //   position: "absolute",
  //   top: -180,
  //   right: -290,
  //   color: "white",
  //   paddingHorizontal: 3,
  //   paddingVertical: 2,
  //   borderRadius: 8,
  //   fontSize: 6,
  //   fontWeight: "700",
  //   zIndex: 9999,
  //   overflow: "hidden",
  // },
  wsBadge: {
    position: "absolute",
    top: -100,
    right: -290,
    color: "white",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 6,
    fontWeight: "700",
    zIndex: 99999,
    overflow: "hidden",
  },
  wordHelpButtons: {
    position: "absolute",
    bottom: 80,
    left: 24,
    right: 24,
    flexDirection: "row",
    gap: 12,
    zIndex: 100000,
  },
  yesButton: {
    flex: 1,
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  noButton: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  yesText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  noText: { color: "#64748B", fontWeight: "700", fontSize: 15 },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#64748B",
    marginBottom: 20,
    lineHeight: 28,
    textAlign: "center",
  },
  progressBarBackground: {
    height: 14,
    backgroundColor: "#E2E8F0",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 24,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#F59E0B",
    borderRadius: 999,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 28,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    width: "100%",
  },
  badge: {
    backgroundColor: "#EFF6FF",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 16,
  },
  tipBadge: { backgroundColor: "#FEF3C7" },
  badgeText: { fontSize: 11, fontWeight: "bold", color: "#1E40AF" },
  text: {
    fontSize: 24,
    lineHeight: 40,
    letterSpacing: 1,
    color: "#334155",
    marginBottom: 28,
  },
  bigLetter: { fontSize: 100, textAlign: "center", marginBottom: 20 },
  word: { fontSize: 42, textAlign: "center", marginBottom: 20 },
  exampleSentence: {
    fontSize: 20,
    lineHeight: 32,
    color: "#475569",
    textAlign: "center",
    marginBottom: 20,
  },
  audioButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DBEAFE",
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 20,
  },
  audioText: {
    marginLeft: 8,
    color: "#2563EB",
    fontWeight: "700",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#2563EB",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  buttonText: { color: "white", fontSize: 18, fontWeight: "700" },
  audioRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  question: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
    color: "#1E293B",
    lineHeight: 38,
    textAlign: "center",
  },
  distractionToast: {
    position: "absolute",
    top: 30,
    right: 26,
    backgroundColor: "#EEF4FF",
    borderColor: "#2563EB",
    borderWidth: 2,
    borderRadius: 20,
    padding: 12,
    maxWidth: 240,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 99999,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  toastMimo: {
    width: 55,
    height: 75,
  },
  toastTextBlock: {
    flex: 1,
    flexShrink: 1,
  },
  toastTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E40AF",
    marginBottom: 2,
  },
  distractionEmoji: { fontSize: 20 },
  distractionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E40AF",
    flexShrink: 1,
    lineHeight: 17,
  },
  option: {
    backgroundColor: "#F8FAFC",
    padding: 22,
    borderRadius: 18,
    marginBottom: 18,
    borderWidth: 2,
    borderColor: "#CBD5E1",
  },
  optionText: { fontSize: 22, textAlign: "center", fontWeight: "600" },
  complete: {
    fontSize: 26,
    lineHeight: 38,
    textAlign: "center",
    color: "#2563EB",
    fontWeight: "700",
  },
  score: { textAlign: "center", color: "#64748B", marginTop: 10, fontSize: 18 },
  ipModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  ipModalCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 420,
  },
  ipModalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 8,
  },
  ipModalHint: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
    marginBottom: 16,
  },
  ipInput: {
    borderWidth: 2,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  ipModalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  ipCancelButton: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  ipSaveButton: {
    flex: 1,
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
});
