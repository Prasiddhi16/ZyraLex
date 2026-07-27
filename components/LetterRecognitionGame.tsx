// components/LetterRecognitionGame.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View, Modal, Image } from 'react-native';
import { LetterRecognitionQuestion } from '../data/practice/types';
import { speakWord } from '../services/speech';

const { width, height } = Dimensions.get('window');

type DifficultyLevel = "beginner" | "intermediate" | "advanced";

interface Props {
  level: DifficultyLevel;
  data: { letterRecognition: LetterRecognitionQuestion[] };
  onComplete: () => void;
  onClose: () => void;
}

export default function LetterRecognitionGame({ level, data, onComplete, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Modal States for Kid-Friendly Feedback
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrectSelection, setIsCorrectSelection] = useState(false);

  const gameDataList = data?.letterRecognition || [];
  const totalQuestions = gameDataList.length;
  const currentData: LetterRecognitionQuestion = gameDataList[currentIndex];

  // Mimo Image Asset Path
  const mimoImageSource = require('../assets/mimoimg.png');

  // Animation Refs
  const bubbleScale = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-height)).current;

  useEffect(() => {
    if (isFinished || totalQuestions === 0 || !currentData) return;

    bubbleScale.setValue(0);
    textFade.setValue(0);
    shakeAnim.setValue(0);

    Animated.parallel([
      Animated.spring(bubbleScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.timing(textFade, { toValue: 1, duration: 400, useNativeDriver: true })
    ]).start();

    if (currentData.voicePrompt) {
      speakWord(currentData.voicePrompt);
    }
  }, [currentIndex, isFinished, totalQuestions]);

  useEffect(() => {
    if (isFinished) {
      speakWord("Incredible job! You mastered this level! Let's move forward.");
      Animated.spring(slideAnim, { toValue: 0, tension: 25, friction: 8, useNativeDriver: true }).start();
    }
  }, [isFinished]);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
  };

  const handleSelection = (choice: string) => {
    if (choice === currentData.correctAnswer) {
      setIsCorrectSelection(true);
      setShowFeedback(true);
      speakWord(currentData.rewardMessage || "Great job!");
      setScore(prev => prev + 1);
    } else {
      setIsCorrectSelection(false);
      setShowFeedback(true);
      triggerShake();
      speakWord(`Not quite! ${currentData.instruction}`);
    }
  };

  const handleAdvanceNextQuestion = () => {
    setShowFeedback(false);
    if (isCorrectSelection) {
      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setIsFinished(true);
      }
    }
  };

  if (totalQuestions === 0 || !currentData) {
    return (
      <View style={s.container}>
        <Text style={s.instruction}>No practice content loaded.</Text>
        <TouchableOpacity style={s.actionBtn} onPress={onClose}>
          <Text style={s.actionBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isWordType = ["containsLetter", "startsWith", "endsWith"].includes(currentData.type);
  const progressPercent = ((currentIndex + 1) / totalQuestions) * 100;

  return (
    <View style={s.container}>
      {!isFinished && (
        <>
          {/* HEADER & PROGRESS BAR */}
          <View style={{ width: '100%' }}>
            <View style={s.headerRow}>
              <Text style={s.scoreText}>Stars: ⭐ {score}/{totalQuestions}</Text>
              <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                <Text style={s.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={s.progressTrack}>
              <View style={[s.progressBar, { width: `${progressPercent}%` }]} />
            </View>
          </View>

          {/* DYNAMIC PROMPT CARD */}
          <Animated.View style={[s.contentBox, { opacity: textFade }]}>
            <Text style={s.instruction}>{currentData.instruction}</Text>
            {!isWordType && <Text style={s.targetDisplay}>{currentData.target}</Text>}
          </Animated.View>

          {/* RESPONSIVE LAYOUT MATRIX */}
          <Animated.View 
            style={[
              isWordType ? s.wordListContainer : s.bubbleGridContainer,
              { transform: [{ scale: bubbleScale }, { translateX: shakeAnim }] }
            ]}
          >
            {currentData.choices.map((choice, i) => (
              <TouchableOpacity
                key={`${currentIndex}-${i}`}
                activeOpacity={0.7}
                style={isWordType ? s.wordCard : [s.bubbleCard, level === "intermediate" ? s.bubbleInter : s.bubbleBeginner]}
                onPress={() => handleSelection(choice)}
              >
                <Text style={isWordType ? s.wordCardText : s.bubbleCardText}>
                  {choice}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
          
          <Text style={s.progressText}>Question {currentIndex + 1} of {totalQuestions}</Text>
        </>
      )}

      {/* 🌟 CORRECT & INCORRECT DYNAMIC FEEDBACK POPUP 🌟 */}
      <Modal
        transparent={true}
        visible={showFeedback}
        animationType="fade"
        onRequestClose={handleAdvanceNextQuestion}
      >
        <View style={s.modalOverlay}>
          <View style={[s.feedbackBox, isCorrectSelection ? s.feedbackBoxCorrect : s.feedbackBoxWrong]}>
            {isCorrectSelection && <Text style={s.feedbackStarDecor}>🌟</Text>}
            
            {/* Mimo character image */}
            <Image source={mimoImageSource} style={s.mimoImage} resizeMode="contain" />
            
            <Text style={[s.feedbackTitle, isCorrectSelection ? s.feedbackTextCorrect : s.feedbackTextWrong]}>
              {isCorrectSelection ? "Correct!" : "Keep Trying!"}
            </Text>
            
            <Text style={s.feedbackSub}>
              {isCorrectSelection 
                ? "Amazing! You got it right! Your hard work is paying off!" 
                : "You can do it! Give it another shot."}
            </Text>
            
            <TouchableOpacity 
              style={[s.feedbackBtn, isCorrectSelection ? s.feedbackBtnCorrect : s.feedbackBtnWrong]} 
              onPress={handleAdvanceNextQuestion}
            >
              <Text style={s.feedbackBtnText}>
                {isCorrectSelection ? "Got it! →" : "Try Again"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 🎉 CLINICAL SUCCESS SHEET */}
      {isFinished && (
        <Animated.View style={[s.celebrationCard, { transform: [{ translateY: slideAnim }] }]}>
          <Text style={s.fireworks}>🎉 🏆 ✨</Text>
          <Text style={s.celebrationTitle}>Level Complete!</Text>
          <Text style={s.celebrationSub}>Splendid visual processing skills on display!</Text>
          
          <View style={s.badgeBox}>
            <Text style={s.badgeEmoji}>🎖️</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.badgeName}>{level.toUpperCase()} Mastery</Text>
              <Text style={s.badgeMeta}>Validated orthographic track processing.</Text>
            </View>
          </View>

          <TouchableOpacity style={s.actionBtn} onPress={onComplete}>
            <Text style={s.actionBtnText}>Continue Journey 🚀</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 30 },
  headerRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  scoreText: { fontSize: 14, fontWeight: '700', color: '#1E40AF', backgroundColor: '#DBEAFE', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20 },
  closeBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#BFDBFE' },
  closeText: { fontSize: 16, color: '#6B9EC8', fontWeight: 'bold' },
  progressTrack: { width: '100%', height: 8, backgroundColor: '#E0F2FE', borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 4 },
  contentBox: { alignItems: 'center', marginVertical: 15 },
  instruction: { fontSize: 20, fontWeight: '700', color: '#1E3A5F', textAlign: 'center', paddingHorizontal: 10, lineHeight: 28 },
  targetDisplay: { fontSize: 90, fontWeight: '900', color: '#2563EB', marginTop: 10 },
  
  // Grid styles for letter bubble types
  bubbleGridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, width: '100%' },
  bubbleCard: { backgroundColor: '#fff', borderWidth: 4, borderColor: '#3B82F6', alignItems: 'center', justifyContent: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  bubbleBeginner: { width: width * 0.38, height: width * 0.38, borderRadius: (width * 0.38) / 2 },
  bubbleInter: { width: width * 0.28, height: width * 0.28, borderRadius: (width * 0.28) / 2 },
  bubbleCardText: { fontSize: 40, fontWeight: '800', color: '#1E3A5F' },

  // List styles for word matching type (Advanced)
  wordListContainer: { width: '100%', gap: 12, paddingHorizontal: 10 },
  wordCard: { backgroundColor: '#fff', width: '100%', paddingVertical: 16, borderRadius: 16, borderWidth: 3, borderColor: '#93C5FD', alignItems: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  wordCardText: { fontSize: 24, fontWeight: '700', color: '#1E3A5F', letterSpacing: 1 },

  progressText: { color: '#6B9EC8', fontSize: 13, fontWeight: '600' },
  celebrationCard: { flex: 1, backgroundColor: '#fff', width: '100%', borderRadius: 24, borderWidth: 1, borderColor: '#BFDBFE', padding: 24, alignItems: 'center', justifyContent: 'center' },
  fireworks: { fontSize: 44, marginBottom: 12 },
  celebrationTitle: { fontSize: 26, fontWeight: '800', color: '#1E3A5F', marginBottom: 6 },
  celebrationSub: { fontSize: 14, color: '#6B9EC8', textAlign: 'center', marginBottom: 20 },
  badgeBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A', padding: 14, borderRadius: 16, marginBottom: 25 },
  badgeEmoji: { fontSize: 32 },
  badgeName: { fontSize: 15, fontWeight: '700', color: '#92400E' },
  badgeMeta: { fontSize: 12, color: '#B45309', marginTop: 1 },
  actionBtn: { backgroundColor: '#2563EB', width: '100%', paddingVertical: 15, borderRadius: 16, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Modals / Overlays UI styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  feedbackBox: { width: '90%', borderRadius: 28, borderWidth: 4, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 8 },
  feedbackBoxCorrect: { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' },
  feedbackBoxWrong: { backgroundColor: '#FFEBEE', borderColor: '#EF5350' },
  mimoImage: { width: 110, height: 110, marginBottom: 16 },
  feedbackStarDecor: { position: 'absolute', top: 16, right: 20, fontSize: 24 },
  feedbackTitle: { fontSize: 28, fontWeight: '900', marginBottom: 8 },
  feedbackTextCorrect: { color: '#2E7D32' },
  feedbackTextWrong: { color: '#C62828' },
  feedbackSub: { fontSize: 16, fontWeight: '600', color: '#455A64', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  feedbackBtn: { width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  feedbackBtnCorrect: { backgroundColor: '#4CAF50' },
  feedbackBtnWrong: { backgroundColor: '#EF5350' },
  feedbackBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' }
});