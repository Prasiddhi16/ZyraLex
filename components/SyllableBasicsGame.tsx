// components/SyllableBasicsGame.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DRUM_ASSETS, REALISTIC_SUBJECTS } from '../constants/imageMap';
import { speakWord } from '../services/speech';

const { width, height } = Dimensions.get('window');

type DifficultyLevel = "beginner" | "intermediate" | "advanced";

interface Props {
  level: DifficultyLevel;
  data: any;
  onComplete: () => void;
  onClose: () => void;
}

export default function SyllableBasicsGame({ level, data, onComplete, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isGameFinished, setIsGameFinished] = useState(false);

  // Mimo Companion States
  const [mimoMood, setMimoMood] = useState<"rocking" | "awesome" | "remix">("rocking");
  const [mimoSpeech, setMimoSpeech] = useState("Tap the drums to find the beats!");

  // Parse structural fields supporting variable names syllableBasics or syllables
  const gameDataList = data?.syllableBasics || data?.syllables || [];
  const totalQuestions = gameDataList.length;
  const currentData = gameDataList[currentIndex] || { word: '', syllablesCount: 0, breakdown: '', meaningClue: '', audioPrompt: '' };

  const contentScale = useRef(new Animated.Value(0.9)).current;
  const slideCelebration = useRef(new Animated.Value(-height)).current;

  // 🐼 Advanced Mimo Box Pop-Out Animation Refs
  const mimoPopAnim = useRef(new Animated.Value(1)).current; 
  const cardShakeAnim = useRef(new Animated.Value(0)).current;
  const bgFlashColor = useRef(new Animated.Value(0)).current;

  const mimoImageSource = require('../assets/mimoimg.png');

  useEffect(() => {
    if (isGameFinished || totalQuestions === 0) return;
    setSelectedAnswer(null);
    setIsCorrect(false);
    setMimoMood("rocking");
    setMimoSpeech(`Listen! How many beats in ${currentData.word}? 🥁`);

    // Entrance Spring
    contentScale.setValue(0.9);
    mimoPopAnim.setValue(1);
    Animated.spring(contentScale, {
      toValue: 1,
      tension: 50,
      friction: 6,
      useNativeDriver: true,
    }).start();

    if (currentData?.audioPrompt) {
      speakWord(currentData.audioPrompt);
    }
  }, [currentIndex, isGameFinished, totalQuestions]);

  useEffect(() => {
    if (isGameFinished) {
      speakWord("Spectacular rhythm! You are an official Syllable Rhythm Master!");
      Animated.spring(slideCelebration, {
        toValue: 0,
        tension: 30,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  }, [isGameFinished]);

  const handleDrumTap = (num: number) => {
    if (isCorrect) return;
    setSelectedAnswer(num);

    // Comic-pop Spring sequence trigger
    mimoPopAnim.setValue(0.7);
    Animated.spring(mimoPopAnim, {
      toValue: 1.1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(mimoPopAnim, { toValue: 1, duration: 100, useNativeDriver: true }).start();
    });

    if (num === currentData.syllablesCount) {
      setIsCorrect(true);
      setMimoMood("awesome");
      setMimoSpeech(`Woohoo! ${currentData.word.toUpperCase()} has ${num} ${num === 1 ? 'beat' : 'beats'}! 🎵`);
      speakWord(`That's right! ${currentData.word} has ${num} ${num === 1 ? 'beat' : 'beats'}: ${currentData.breakdown}!`);
    } else {
      setMimoMood("remix");
      setMimoSpeech("Let's hit the remix! Try counting that rhythm again! 🔥");
      speakWord(`Let's try that rhythm again! Listen closely to the beats.`);
      
      // Rumble the entire game card structure + change bg environment frame subtly
      Animated.parallel([
        Animated.sequence([
          Animated.timing(cardShakeAnim, { toValue: 14, duration: 40, useNativeDriver: true }),
          Animated.timing(cardShakeAnim, { toValue: -14, duration: 40, useNativeDriver: true }),
          Animated.timing(cardShakeAnim, { toValue: 10, duration: 40, useNativeDriver: true }),
          Animated.timing(cardShakeAnim, { toValue: -10, duration: 40, useNativeDriver: true }),
          Animated.timing(cardShakeAnim, { toValue: 0, duration: 40, useNativeDriver: true })
        ]),
        Animated.sequence([
          Animated.timing(bgFlashColor, { toValue: 1, duration: 120, useNativeDriver: false }),
          Animated.timing(bgFlashColor, { toValue: 0, duration: 450, useNativeDriver: false })
        ])
      ]).start();

      setTimeout(() => {
        setSelectedAnswer(null);
        setMimoMood("rocking");
        setMimoSpeech("Listen closely! You got this! 🌟");
      }, 1400);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsGameFinished(true);
    }
  };

  if (totalQuestions === 0) {
    return (
      <View style={s.safeContainer}>
        <ScrollView contentContainerStyle={s.scrollContent}>
          <Text style={s.clueText}>No audio beat channels active for this level selection.</Text>
          <TouchableOpacity style={s.finalBtn} onPress={onClose}>
            <Text style={s.finalBtnText}>Go Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  const cleanClueText = currentData?.meaningClue 
    ? (currentData.meaningClue.includes(" ") ? currentData.meaningClue.substring(currentData.meaningClue.indexOf(" ") + 1) : currentData.meaningClue)
    : "";

  const lookupKey = currentData?.word?.toUpperCase();
  const mainSubjectImage = REALISTIC_SUBJECTS[lookupKey] || null;

  const interpolatedBg = bgFlashColor.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FAF5FF', '#FFF0F2']
  });

  return (
    <Animated.View style={[s.safeContainer, { backgroundColor: interpolatedBg }]}>
      <ScrollView 
        style={s.scrollContainer} 
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={true}
        keyboardShouldPersistTaps="handled"
      >
        {!isGameFinished && (
          <Animated.View style={[s.innerWrapper, { transform: [{ scale: contentScale }, { translateX: cardShakeAnim }] }]}>
            <View style={s.headerRow}>
              <Text style={s.progressBadge}>Rhythm: {currentIndex + 1}/{totalQuestions}</Text>
              <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                <Text style={s.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={s.questionCard}>
              {mainSubjectImage && (
                <Image 
                  source={mainSubjectImage} 
                  style={s.heroRender} 
                  resizeMode="contain" 
                />
              )}
              
              <Text style={s.mainWord}>{isCorrect ? currentData.breakdown : currentData.word}</Text>
              <Text style={s.clueText}>{cleanClueText}</Text>
            </View>

            {/* 🐼 THE COMIC-POP MIMO BOX POP-OUT */}
            <Animated.View style={[s.mimoPopOutContainer, { transform: [{ scale: mimoPopAnim }] }]}>
              <View style={[
                s.mimoInnerBox,
                mimoMood === "awesome" && s.boxCorrect,
                mimoMood === "remix" && s.boxWrong
              ]}>
                <Image source={mimoImageSource} style={s.mimoAvatarSide} resizeMode="contain" />
                <View style={{ flex: 1 }}>
                  <Text style={[
                    s.mimoMessageText,
                    mimoMood === "awesome" && s.textCorrect,
                    mimoMood === "remix" && s.textWrong
                  ]}>
                    {mimoSpeech}
                  </Text>
                </View>
              </View>
            </Animated.View>

            <View style={s.drumContainer}>
              {[1, 2, 3].map((num) => {
                const isCurrentSelection = selectedAnswer === num;
                const isWrongSelection = isCurrentSelection && !isCorrect;

                return (
                  <TouchableOpacity
                    key={num}
                    activeOpacity={0.8}
                    disabled={isCorrect}
                    onPress={() => handleDrumTap(num)}
                    style={[
                      s.drumPad,
                      isCurrentSelection && s.drumSelected,
                      isWrongSelection && s.drumWrong,
                      isCorrect && currentData.syllablesCount === num && s.drumCorrect
                    ]}
                  >
                    <Image source={DRUM_ASSETS.ACTIVE} style={s.inputDrumAsset} />
                    
                    <View style={[s.circleBadge, isCorrect && currentData.syllablesCount === num && s.badgeCorrect, isWrongSelection && s.badgeWrong]}>
                      <Text style={s.drumNumberText}>{num}</Text>
                    </View>
                    <Text style={s.beatLabel}>{num === 1 ? "1 Beat" : `${num} Beats`}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={s.actionRow}>
              {isCorrect && (
                <TouchableOpacity style={s.nextBtn} onPress={handleNext}>
                  <Text style={s.nextBtnText}>Next Rhythm Drum 🎵</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        )}

        {isGameFinished && (
          <Animated.View style={[s.celebrationSheet, { transform: [{ translateY: slideCelebration }] }]}>
            <Text style={s.trophy}>🏆 🌟 🎶</Text>
            <Text style={s.title}>Rhythm Master!</Text>
            <Text style={s.sub}>You perfectly identified all {totalQuestions} syllable sounds today!</Text>

            <View style={s.bonusCard}>
              <Text style={s.starIcon}>⚡</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.bonusTitle}>Golden Ear Unlocked</Text>
                <Text style={s.bonusMeta}>Fantastic listening precision for phonetic partitions.</Text>
              </View>
            </View>

            <TouchableOpacity style={s.finalBtn} onPress={onComplete}>
              <Text style={s.finalBtnText}>Finish Journey! 🚀</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  safeContainer: { flex: 1 },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 45, paddingBottom: 40, alignItems: 'center', flexGrow: 1 },
  innerWrapper: { width: '100%', alignItems: 'center', gap: 14 },
  headerRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  progressBadge: { fontSize: 13, fontWeight: '700', color: '#7C3AED', backgroundColor: '#F3E8FF', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, overflow: 'hidden' },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E9D5FF' },
  closeText: { fontSize: 16, color: '#A78BFA', fontWeight: 'bold' },
  
  questionCard: { backgroundColor: '#fff', width: '100%', paddingVertical: 16, paddingHorizontal: 20, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: '#E9D5FF', shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  heroRender: { width: 130, height: 130, marginBottom: 8, borderRadius: 16 },
  mainWord: { fontSize: 34, fontWeight: '900', color: '#4C1D95', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 },
  clueText: { fontSize: 14, fontWeight: '600', color: '#6D28D9', textAlign: 'center', paddingHorizontal: 10, marginTop: 4 },
  
  // 🐼 Comic-Pop Horizontal Pop Out Style
  mimoPopOutContainer: { width: '100%', marginVertical: 4 },
  mimoInnerBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 22, borderBottomWidth: 4, borderColor: '#D8B4FE', gap: 12, shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 5, elevation: 3 },
  boxCorrect: { backgroundColor: '#E6FDF4', borderColor: '#34D399' },
  boxWrong: { backgroundColor: '#FFF0F2', borderColor: '#F87171' },
  mimoAvatarSide: { width: 55, height: 55 },
  mimoMessageText: { fontSize: 14, fontWeight: '700', color: '#4C1D95', lineHeight: 20 },
  textCorrect: { color: '#047857' },
  textWrong: { color: '#B91C1C' },

  drumContainer: { flexDirection: 'row', gap: 10, justifyContent: 'center', width: '100%', marginTop: 2 },
  drumPad: { flex: 1, backgroundColor: '#fff', borderWidth: 3, borderColor: '#D8B4FE', borderRadius: 20, paddingVertical: 14, alignItems: 'center', shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  drumSelected: { borderColor: '#A78BFA', backgroundColor: '#F3E8FF' },
  drumCorrect: { borderColor: '#34D399', backgroundColor: '#D1FAE5' },
  drumWrong: { borderColor: '#F87171', backgroundColor: '#FEE2E2' },
  inputDrumAsset: { width: 50, height: 40, resizeMode: 'contain', marginBottom: 8 },
  circleBadge: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  badgeCorrect: { backgroundColor: '#34D399' },
  badgeWrong: { backgroundColor: '#F87171' },
  drumNumberText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  beatLabel: { fontSize: 12, fontWeight: '700', color: '#4B5563' },
  
  actionRow: { width: '100%', minHeight: 55, justifyContent: 'center', marginTop: 6 },
  nextBtn: { backgroundColor: '#A78BFA', width: '100%', paddingVertical: 15, borderRadius: 16, alignItems: 'center', shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  nextBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  celebrationSheet: { width: '100%', borderRadius: 24, borderWidth: 1, borderColor: '#E9D5FF', padding: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', marginTop: 'auto', marginBottom: 'auto' },
  trophy: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#4C1D95', marginBottom: 6 },
  sub: { fontSize: 13, color: '#7C3AED', textAlign: 'center', marginBottom: 25, paddingHorizontal: 10 },
  bonusCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F5F3FF', borderWidth: 1, borderColor: '#DDD6FE', padding: 16, borderRadius: 16, width: '100%', marginBottom: 30 },
  starIcon: { fontSize: 28, color: '#8B5CF6' },
  bonusTitle: { fontSize: 14, fontWeight: '700', color: '#5B21B6' },
  bonusMeta: { fontSize: 11, color: '#6D28D9', marginTop: 2 },
  finalBtn: { backgroundColor: '#7C3AED', width: '100%', paddingVertical: 15, borderRadius: 16, alignItems: 'center' },
  finalBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' }
});