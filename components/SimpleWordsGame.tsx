// components/SimpleWordsGame.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { speakWord } from '../services/speech';

const { width, height } = Dimensions.get('window');

type DifficultyLevel = "beginner" | "intermediate" | "advanced";

interface Props {
  level: DifficultyLevel;
  data: any;
  onComplete: () => void;
  onClose: () => void;
}

export default function SimpleWordsGame({ level, data, onComplete, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);
  const [isWordComplete, setIsWordComplete] = useState(false);
  const [isGameFinished, setIsGameFinished] = useState(false);

  // Fun Mimo Feedback States
  const [mimoStatus, setMimoStatus] = useState<"happy" | "celebrating" | "oops">("happy");
  const [mimoSpeech, setMimoSpeech] = useState("Tap letters to build the word!");

  // Support matrix layouts called simpleWords or words
  const gameDataList = data?.simpleWords || data?.words || [];
  const totalWords = gameDataList.length;
  const currentData = gameDataList[currentIndex] || { word: '', scrambled: [], meaningClue: '', audioPrompt: '' };

  // Static Image Asset Path for Mimo
  const mimoImageSource = require('../assets/mimoimg.png');

  // Animation Anchors
  const letterScale = useRef(new Animated.Value(0)).current;
  const slideCelebration = useRef(new Animated.Value(-height)).current;
  
  // New Mimo Reaction Animation Refs
  const mimoBounce = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const bgFlashColor = useRef(new Animated.Value(0)).current;

  // Track dynamic scrambles so they stay stable per question
  const [scrambledPool, setScrambledPool] = useState<string[]>([]);
  const [usedIndices, setUsedIndices] = useState<number[]>([]);

  useEffect(() => {
    if (isGameFinished || totalWords === 0) return;

    // Reset layout states per challenge loop
    setSelectedLetters([]);
    setUsedIndices([]);
    setIsWordComplete(false);
    setScrambledPool(currentData.scrambled ? [...currentData.scrambled] : []);
    setMimoStatus("happy");
    setMimoSpeech("Can you spell this word? 🤔");

    letterScale.setValue(0);
    Animated.spring(letterScale, {
      toValue: 1,
      tension: 40,
      friction: 5,
      useNativeDriver: true,
    }).start();

    if (currentData?.audioPrompt) {
      speakWord(currentData.audioPrompt);
    }
  }, [currentIndex, isGameFinished, totalWords]);

  useEffect(() => {
    if (isGameFinished) {
      speakWord("Incredible job! You are a master of simple words! Keep going to expand your brilliant mind!");
      Animated.spring(slideCelebration, {
        toValue: 0,
        tension: 25,
        friction: 6,
        useNativeDriver: true,
      }).start();
    }
  }, [isGameFinished]);

  const triggerMimoBounce = () => {
    Animated.sequence([
      Animated.timing(mimoBounce, { toValue: -20, duration: 120, useNativeDriver: true }),
      Animated.timing(mimoBounce, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleLetterTap = (letter: string, index: number) => {
    if (usedIndices.includes(index) || isWordComplete) return;

    const nextSelection = [...selectedLetters, letter];
    const nextUsed = [...usedIndices, index];
    
    setSelectedLetters(nextSelection);
    setUsedIndices(nextUsed);
    speakWord(letter.toLowerCase());
    
    // Mimo bounces lightly with positive energy on regular letter placement
    triggerMimoBounce();

    // Check if word entry is complete
    if (nextSelection.length === (currentData.word?.length || 0)) {
      const spelledWord = nextSelection.join("");
      
      if (spelledWord === currentData.word) {
        setIsWordComplete(true);
        setMimoStatus("celebrating");
        setMimoSpeech(`Sparkly perfect! That spells ${currentData.word}! 🎉`);
        speakWord(`Sparkly perfect! That spells ${currentData.word}!`);
        
        // Big happy victory dance bounce sequence for Mimo
        Animated.sequence([
          Animated.timing(mimoBounce, { toValue: -35, duration: 150, useNativeDriver: true }),
          Animated.timing(mimoBounce, { toValue: 0, duration: 120, useNativeDriver: true }),
          Animated.timing(mimoBounce, { toValue: -20, duration: 100, useNativeDriver: true }),
          Animated.timing(mimoBounce, { toValue: 0, duration: 100, useNativeDriver: true })
        ]).start();

      } else {
        // Handle Wrong Configuration Feedback 
        setMimoStatus("oops");
        setMimoSpeech("Keep trying! Let's shake those blocks and try again! 💪");
        
        // Shake blocks + Flash soft pastel red background color frame
        Animated.parallel([
          Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
          ]),
          Animated.sequence([
            Animated.timing(bgFlashColor, { toValue: 1, duration: 150, useNativeDriver: false }),
            Animated.timing(bgFlashColor, { toValue: 0, duration: 500, useNativeDriver: false })
          ])
        ]).start();

        setTimeout(() => {
          speakWord("Let's shake those blocks and try that word one more time!");
          setSelectedLetters([]);
          setUsedIndices([]);
          setMimoStatus("happy");
          setMimoSpeech("You can do it! Try another combination! 🌟");
        }, 1400);
      }
    }
  };

  const handleNextWord = () => {
    if (currentIndex < totalWords - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsGameFinished(true);
    }
  };

  if (totalWords === 0) {
    return (
      <View style={s.container}>
        <Text style={s.clueText}>No word architecture modules active for this level.</Text>
        <TouchableOpacity style={s.finalBtn} onPress={onClose}>
          <Text style={s.finalBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const clueEmoji = currentData.meaningClue?.split(" ")[0] || "📝";
  const clueText = currentData.meaningClue?.includes(" ") 
    ? currentData.meaningClue.substring(currentData.meaningClue.indexOf(" ") + 1)
    : currentData.meaningClue;

  // Background interpolation for mistakes
  const interpolatedBg = bgFlashColor.interpolate({
    inputRange: [0, 1],
    outputRange: ['#EFF6FF', '#FFEBEE']
  });

  return (
    <Animated.View style={[s.container, { backgroundColor: interpolatedBg }]}>
      {!isGameFinished && (
        <>
          <View style={s.headerRow}>
            <Text style={s.progressBadge}>Words Built: {currentIndex}/{totalWords}</Text>
            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <Text style={s.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 🐼 DYNAMIC INTERACTIVE COMPANION COMPONENT (MIMO ZONE) */}
          <View style={s.mimoZone}>
            <View style={[
              s.mimoBubble,
              mimoStatus === "celebrating" && s.mimoBubbleCorrect,
              mimoStatus === "oops" && s.mimoBubbleWrong
            ]}>
              <Text style={[
                s.mimoBubbleText,
                mimoStatus === "celebrating" && s.textCorrect,
                mimoStatus === "oops" && s.textWrong
              ]}>
                {mimoSpeech}
              </Text>
            </View>

            <Animated.View style={{ transform: [{ translateY: mimoBounce }] }}>
              <Image source={mimoImageSource} style={s.mimoAvatar} resizeMode="contain" />
            </Animated.View>
          </View>

          <View style={s.clueBox}>
            <Text style={s.clueEmoji}>{clueEmoji}</Text>
            <Text style={s.clueText}>{clueText}</Text>
          </View>

          <View style={s.trayRow}>
            {Array.from({ length: currentData.word?.length || 0 }).map((_, i) => (
              <View key={i} style={[s.slot, isWordComplete && s.slotSuccess]}>
                <Text style={s.slotText}>
                  {selectedLetters[i] || ""}
                </Text>
              </View>
            ))}
          </View>

          <Animated.View style={[s.blocksContainer, { transform: [{ translateX: shakeAnim }] }]}>
            {scrambledPool.map((letter, index) => {
              const isUsed = usedIndices.includes(index);
              return (
                <Animated.View key={index} style={{ transform: [{ scale: letterScale }] }}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    disabled={isUsed || isWordComplete}
                    style={[s.block, isUsed && s.blockDisabled]}
                    onPress={() => handleLetterTap(letter, index)}
                  >
                    <Text style={[s.blockText, isUsed && s.blockTextDisabled]}>{letter}</Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </Animated.View>

          <View style={{ width: '100%', minHeight: 60 }}>
            {isWordComplete && (
              <TouchableOpacity style={s.continueBtn} onPress={handleNextWord}>
                <Text style={s.continueBtnText}>Next Word Journey 🌟</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}

      {/* 🏆 GRAND MILESTONE CELEBRATION OVERLAY */}
      {isGameFinished && (
        <Animated.View style={[s.celebrationSheet, { transform: [{ translateY: slideCelebration }] }]}>
          <Text style={s.trophy}>🏆 ✨ 🪄</Text>
          <Text style={s.title}>Word Architect!</Text>
          <Text style={s.sub}>You built all {totalWords} basic foundational words seamlessly!</Text>

          <View style={s.bonusCard}>
            <Text style={s.starIcon}>🌟</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.bonusTitle}>Super Speller Achievement</Text>
              <Text style={s.bonusMeta}>Unlocked for mastering vowel-consonant combinations</Text>
            </View>
          </View>

          <Text style={s.footerParagraph}>
            Your reading skills are climbing higher! Let's return to our dashboard and open up the awesome <Text style={{fontWeight: '700', color: '#1E40AF'}}>Syllable Basics Challenges</Text>!
          </Text>

          <TouchableOpacity style={s.finalBtn} onPress={onComplete}>
            <Text style={s.finalBtnText}>Claim Your Trophy! 🚀</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 45, paddingBottom: 25, alignItems: 'center', justifyContent: 'space-between' },
  headerRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressBadge: { fontSize: 13, fontWeight: '700', color: '#2563EB', backgroundColor: '#DBEAFE', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, overflow: 'hidden' },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#BFDBFE' },
  closeText: { fontSize: 16, color: '#6B9EC8', fontWeight: 'bold' },
  
  // 🐼 Animated Mimo Row Elements
  mimoZone: { width: '100%', alignItems: 'center', marginVertical: 4 },
  mimoAvatar: { width: 85, height: 85 },
  mimoBubble: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18, borderBottomWidth: 3, borderColor: '#BFDBFE', maxWidth: '85%', marginBottom: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  mimoBubbleCorrect: { backgroundColor: '#DCFCE7', borderColor: '#4ADE80' },
  mimoBubbleWrong: { backgroundColor: '#FFEBEE', borderColor: '#E57373' },
  mimoBubbleText: { fontSize: 14, fontWeight: '700', color: '#1E3A5F', textAlign: 'center' },
  textCorrect: { color: '#15803D' },
  textWrong: { color: '#B91C1C' },

  clueBox: { backgroundColor: '#fff', width: '100%', padding: 12, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#BFDBFE', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  clueEmoji: { fontSize: 36, marginBottom: 4 },
  clueText: { fontSize: 14, fontWeight: '600', color: '#1E3A5F', textAlign: 'center' },
  trayRow: { flexDirection: 'row', gap: 12, marginVertical: 12 },
  slot: { width: width * 0.16, height: width * 0.18, borderRadius: 16, backgroundColor: '#E0F2FE', borderWidth: 3, borderColor: '#93C5FD', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  slotSuccess: { backgroundColor: '#DCFCE7', borderColor: '#4ADE80', borderStyle: 'solid' },
  slotText: { fontSize: 28, fontWeight: '800', color: '#1E3A5F' },
  blocksContainer: { flexDirection: 'row', gap: 14, justifyContent: 'center', flexWrap: 'wrap', width: '100%', marginVertical: 8 },
  block: { width: width * 0.18, height: width * 0.18, borderRadius: 18, backgroundColor: '#fff', borderWidth: 4, borderColor: '#2563EB', alignItems: 'center', justifyContent: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4 },
  blockDisabled: { backgroundColor: '#DBEAFE', borderColor: '#BFDBFE', elevation: 0, shadowOpacity: 0 },
  blockText: { fontSize: 28, fontWeight: '900', color: '#1E40AF' },
  blockTextDisabled: { color: '#93C5FD' },
  continueBtn: { backgroundColor: '#4ADE80', width: '100%', paddingVertical: 15, borderRadius: 16, alignItems: 'center', shadowColor: '#4ADE80', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 3 },
  continueBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  celebrationSheet: { flex: 1, backgroundColor: '#fff', width: '100%', borderRadius: 24, borderWidth: 1, borderColor: '#BFDBFE', padding: 24, alignItems: 'center', justifyContent: 'center' },
  trophy: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#1E3A5F', marginBottom: 6 },
  sub: { fontSize: 13, color: '#6B9EC8', textAlign: 'center', marginBottom: 20, paddingHorizontal: 12 },
  bonusCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A', padding: 14, borderRadius: 16, width: '100%', marginBottom: 20 },
  starIcon: { fontSize: 30 },
  bonusTitle: { fontSize: 14, fontWeight: '700', color: '#92400E' },
  bonusMeta: { fontSize: 11, color: '#B45309', marginTop: 2 },
  footerParagraph: { fontSize: 13, color: '#4B5563', textAlign: 'center', lineHeight: 22, marginBottom: 25 },
  finalBtn: { backgroundColor: '#2563EB', width: '100%', paddingVertical: 15, borderRadius: 16, alignItems: 'center' },
  finalBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' }
});