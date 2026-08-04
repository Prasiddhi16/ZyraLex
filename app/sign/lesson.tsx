// app/sign/lesson.tsx

import { useSignModule } from '@/hooks/useSignModule';
import { recordLessonCompletion } from '@/lib/queries/signModule';
import { supabase } from '@/lib/supabase';
import { Lesson, Level, SignItem } from '@/types/lesson';
import { useLearningTimeTracker } from '@/utils/useLearningTimeTracker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Mascot } from '../../components/lesson/Mascot';
import { MatchGame } from '../../components/lesson/MatchGame';
import { QuizSlide } from '../../components/lesson/QuizSlide';
import { ResultsScreen } from '../../components/lesson/ResultsScreen';
import { TeachSlide } from '../../components/lesson/TeachSlide';
import { COLORS } from '../../constants/colors';

type QuizType = 'whatSign' | 'whichImage';

type Phase =
  | { name: 'teach';      signIndex: number }
  | { name: 'inQuiz';     signIndex: number; quizType: QuizType }
  | { name: 'reviewItem'; queue: SignItem[]; queueIndex: number; quizType: QuizType }
  | { name: 'match' }
  | { name: 'results' };

type MascotState = {
  visible: boolean;
  mood: 'cheer' | 'correct' | 'wrong' | 'encourage';
  message: string;
  showNext: boolean;
  nextLabel: string;
  onNext: () => void;
};

const HIDDEN_MASCOT: MascotState = {
  visible: false, mood: 'cheer', message: '',
  showNext: false, nextLabel: '', onNext: () => {},
};

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// Returns the quiz type for teach-phase index
function teachQuizType(signIndex: number): QuizType {
  return signIndex % 2 === 0 ? 'whatSign' : 'whichImage';
}

// Returns the opposite quiz type
function opposite(type: QuizType): QuizType {
  return type === 'whatSign' ? 'whichImage' : 'whatSign';
}

interface Props {
  levelId: string;
  lessonId: string;
  onRetake: () => void;
  levels: Level[];
  lessonMap: Record<string, Lesson>;
}

function LessonInner({ levelId, lessonId, onRetake, levels, lessonMap }: Props) {
  useLearningTimeTracker("sign");

  const router = useRouter();
  const lessonData = lessonMap[`${levelId}_${lessonId}`];

  const [phase, setPhase] = useState<Phase>({
    name: 'teach',
    signIndex: 0,
  });

  const [score, setScore] = useState(0);
  const [totalQ, setTotalQ] = useState(0);
  const [mascot, setMascot] = useState<MascotState>(HIDDEN_MASCOT);
  if (!lessonData) {
    return (
      <View style={styles.safe}>
        <Text style={styles.error}>Lesson not found.</Text>
      </View>
    );
  }

  const signs = lessonData.signs;

  const getNextLesson = () => {
    const level = levels.find(l => l.levelId === levelId);
    if (!level) return null;
    const idx = level.lessons.findIndex(l => l.lessonId === lessonId);
    if (idx === -1 || idx >= level.lessons.length - 1) return null;
    return level.lessons[idx + 1];
  };

  const getProgress = (): number => {
    if (phase.name === 'teach') {
      return (phase.signIndex * 2) / (signs.length * 2) * 50;
    }
    if (phase.name === 'inQuiz') {
      return (phase.signIndex * 2 + 1) / (signs.length * 2) * 50;
    }
    if (phase.name === 'reviewItem') {
      return 50 + (phase.queueIndex / signs.length) * 30;
    }
    if (phase.name === 'match') return 80;
    return 100;
  };

  const dismissAndRun = useCallback((cb: () => void) => {
    setMascot(HIDDEN_MASCOT);
    setTimeout(cb, 50);
  }, []);

  const showMascot = useCallback((
    mood: MascotState['mood'],
    message: string,
    showNext: boolean,
    nextLabel: string,
    onNext: () => void,
  ) => {
    setMascot({ visible: true, mood, message, showNext, nextLabel, onNext });
  }, []);

  const handleBack = () => {
    Alert.alert(
      'Quit Lesson?',
      'Your progress in this lesson will not be saved.',
      [
        { text: 'Continue Lesson', style: 'cancel' },
        { text: 'Quit', style: 'destructive', onPress: () => router.push('/sign/learn') },
      ],
    );
  };

  // After teaching a sign, move to its alternating quiz type
  const handleTeachNext = () => {
    if (phase.name !== 'teach') return;
    setPhase({
      name: 'inQuiz',
      signIndex: phase.signIndex,
      quizType: teachQuizType(phase.signIndex),
    });
  };

  // Teach next sign or start review
  const handleInQuizAnswer = (correct: boolean) => {
    if (phase.name !== 'inQuiz') return;
    const { signIndex, quizType } = phase;
    setTotalQ(t => t + 1);
    if (correct) setScore(s => s + 1);

    const isLastSign = signIndex === signs.length - 1;
    const nextLabel  = isLastSign ? 'Start Review' : 'Next Sign';

    const goNext = () => {
      if (!isLastSign) {
        dismissAndRun(() => setPhase({ name: 'teach', signIndex: signIndex + 1 }));
      } else {
        // Building review queue, shuffled signs, each with opposite quiz type
        const shuffled = shuffle(signs);
        const queue = shuffled;
        dismissAndRun(() => setPhase({
          name: 'reviewItem',
          queue,
          queueIndex: 0,
          quizType: opposite(teachQuizType(
            signs.findIndex(s => s.signId === shuffled[0].signId)
          )),
        }));
      }
    };

    showMascot(
      correct ? 'correct' : 'wrong',
      correct
        ? correctMessages[Math.floor(Math.random() * correctMessages.length)]
        : wrongMessages[Math.floor(Math.random() * wrongMessages.length)],
      true, nextLabel, goNext,
    );
  };

  // deriving opposite type from original teach index
  const handleReviewAnswer = (correct: boolean) => {
    if (phase.name !== 'reviewItem') return;
    const { queue, queueIndex } = phase;
    setTotalQ(t => t + 1);
    if (correct) setScore(s => s + 1);

    const isLast    = queueIndex === queue.length - 1;
    const nextLabel = isLast ? 'Start Match Game' : 'Next Question';

    const goNext = () => {
      if (!isLast) {
        const nextIndex = queueIndex + 1;
        const nextSign  = queue[nextIndex];
        // Derive the original teach index for this sign to get its opposite type
        const originalTeachIndex = signs.findIndex(s => s.signId === nextSign.signId);
        dismissAndRun(() => setPhase({
          name: 'reviewItem',
          queue,
          queueIndex: nextIndex,
          quizType: opposite(teachQuizType(originalTeachIndex)),
        }));
      } else {
        dismissAndRun(() => setPhase({ name: 'match' }));
      }
    };
    
    //Mascot Helper
    showMascot(
      correct ? 'correct' : 'wrong',
      correct
        ? correctMessages[Math.floor(Math.random() * correctMessages.length)]
        : wrongMessages[Math.floor(Math.random() * wrongMessages.length)],
      true, nextLabel, goNext,
    );
  };
 
  // Match helper
  const handleMatchComplete = useCallback(async (
    matchScore: number, matchTotal: number,
  ) => {
    const finalScore = score + matchScore;
    const finalTotal = totalQ + matchTotal;
    setScore(finalScore);
    setTotalQ(finalTotal);
    const pct   = finalTotal > 0 ? Math.round((finalScore / finalTotal) * 100) : 0;
    const stars = pct >= 90 ? 3 : pct >= 60 ? 2 : 1;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const levelNumber = Number(levelId.replace('level-', ''));
      const lessonNumber = Number(lessonData.lessonId.replace('lesson-', ''));
      await recordLessonCompletion({
        userId: user.id,
        lessonUuid: lessonData.lessonUuid, // the real lessons.id uuid
        levelNumber,
        lessonNumber,
        scorePct: pct,
        totalXp: lessonData.xp,
      }).catch(console.error);
    }
    showMascot(
      'cheer',
      "You crushed it! \nLet's see your final results!",
      true, 'See Results',
      () => dismissAndRun(() => setPhase({ name: 'results' })),
    );
  }, [score, totalQ]);

  const progressPct = getProgress();

  const currentSign =
    phase.name === 'teach'      ? signs[phase.signIndex] :
    phase.name === 'inQuiz'     ? signs[phase.signIndex] :
    phase.name === 'reviewItem' ? phase.queue[phase.queueIndex] :
    signs[0];

  //render
  return (
    <View style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>
        <Text style={styles.xpLabel}>⭐ {lessonData.xp} XP</Text>
      </View>

      {mascot.visible && (
        <Mascot
          mood={mascot.mood}
          message={mascot.message}
          showNext={mascot.showNext}
          nextLabel={mascot.nextLabel}
          onDismiss={mascot.onNext}
        />
      )}

      <View style={styles.content}>
        {phase.name === 'teach' && (
          <TeachSlide
            sign={currentSign}
            index={phase.signIndex}
            total={signs.length}
            onNext={handleTeachNext}
          />
        )}

        {phase.name === 'inQuiz' && (
          <QuizSlide
            signs={signs}
            currentSign={currentSign}
            quizType={phase.quizType}
            onAnswer={handleInQuizAnswer}
          />
        )}

        {phase.name === 'reviewItem' && (
          <QuizSlide
            signs={signs}
            currentSign={currentSign}
            quizType={phase.quizType}
            onAnswer={handleReviewAnswer}
          />
        )}

        {phase.name === 'match' && (
          <MatchGame signs={signs} onComplete={handleMatchComplete} />
        )}

        {phase.name === 'results' && (
          <ResultsScreen
            lessonTitle={lessonData.title}
            score={score}
            total={totalQ}
            xp={lessonData.xp}
            nextLesson={getNextLesson()}
            onRetake={onRetake}
            onNextLesson={(nextLessonId) =>
              router.replace({
                pathname: '/sign/lesson',
                params: { levelId, lessonId: nextLessonId },
              })
             }
            onPractice={() =>
              router.push({
                pathname: '/sign/practice',
                params: { lessonId: lessonData.lessonId } ,
              })
            }
            onBackToLessons={() => router.push('/sign/learn')}
          />
        )}
      </View>
    </View>
  );
}

export default function LessonScreen() {
  const { levelId, lessonId } = useLocalSearchParams<{
    levelId: string; lessonId: string;
  }>();
  const [retakeCount, setRetakeCount] = useState(0);
  const { levels, lessonMap, loading, error } = useSignModule();
  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} />;
  if (error) return <Text style={styles.error}>{error}</Text>;

  return (
    <LessonInner
      key={`${levelId}_${lessonId}_${retakeCount}`}
      levelId={levelId ?? ''}
      lessonId={lessonId ?? ''}
      levels={levels}
      lessonMap={lessonMap}
      onRetake={() => setRetakeCount(c => c + 1)}
    />
  );
}

const correctMessages = [
  'Perfect! 🎯', 'Nailed it! ✨', 'You got it! 🙌',
  'Excellent! 🌟', "That's right! 💪",
];
const wrongMessages = [
  "Not quite — you'll get it! 💙",
  'Almost there! Try to remember the hint.',
  'Keep going — mistakes help you learn!',
  "No worries, let's keep moving! 🚀",
];

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: COLORS.white },
  error: { padding: 24, fontSize: 16, color: COLORS.darkGray },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.cream,
    justifyContent: 'center', alignItems: 'center',
  },
  backText: { fontSize: 22, color: COLORS.darkGray, fontWeight: '600' },
  progressBar: {
    flex: 1, height: 8,
    backgroundColor: COLORS.cream,
    borderRadius: 4, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: COLORS.primary, borderRadius: 4,
  },
  xpLabel:  { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  content:  { flex: 1 },
});