import { useSignModule } from '@/hooks/useSignModule';
import { FlashCARD } from "@/models/flashcard";
import { createFlashCards } from "@/utils/flashcardHelp";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ResizeMode, Video } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function FlashCardScreen() {
  const { levelId, lessonId } = useLocalSearchParams<{ levelId: string; lessonId: string }>();
  const { lessonMap, loading, levels } = useSignModule();
  const lesson = lessonMap[`${levelId}_${lessonId}`];
  const router = useRouter();

  const [flashcards, setFlashcards] = useState<FlashCARD[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  useEffect(() => {
    if (lesson) {
      setFlashcards(shuffleArray(createFlashCards(lesson)));
      setCurrentCard(0);
      setFlipped(false);
    }
  }, [lesson]);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;
  if (!lesson) {
    return <Text style={{ margin: 16 }}>Lesson not found</Text>;
  }

  const totalCards = flashcards.length;
  const card = flashcards[currentCard];

 const markLessonComplete = async () => {
  // Mark this Flash Card lesson as completed
  await AsyncStorage.setItem(
    `flash_${levelId}_${lessonId}_completed`,
    "true"
  );

  // Check if all Flash Card lessons in this level are completed
  const currentLevel = levels.find(l => l.levelId === levelId);

  if (currentLevel) {
    const results = await Promise.all(
      currentLevel.lessons.map(l =>
        AsyncStorage.getItem(
          `flash_${levelId}_${l.lessonId}_completed`
        )
      )
    );

    const allComplete = results.every(val => val === "true");

    if (allComplete) {
      await AsyncStorage.setItem(
        `flash_level_${levelId}_completed`,
        "true"
      );

    const key = `flash_${levelId}_${lessonId}_completed`;

const value = await AsyncStorage.getItem(key);

console.log("Saved key:", key);
console.log("Saved value:", value);
    }
  }
};

  const handleAnswer = async (action: string) => {
    if (action === "again" && currentCard > 0) {
      setCurrentCard(currentCard - 1);
    } else if (action === "skip" && currentCard < totalCards) {
      setCurrentCard(currentCard + 1);
    } else if (action === "next") {
      if (currentCard < totalCards - 1) {
        setCurrentCard(currentCard + 1);
      } else {
        await markLessonComplete();
        setShowCompleteModal(true); 
      }
    }
    setFlipped(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Flash Cards – {lesson.title}</Text>
        <Text style={styles.subtitle}>Learn • Practice • Remember</Text>
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>{currentCard + 1} / {totalCards}</Text>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${((currentCard + 1) / totalCards) * 100}%` }]} />
        </View>
      </View>

      {card && (
        <Pressable style={styles.card} onPress={() => setFlipped(!flipped)}>
          {!flipped ? (
            <>
              <Text style={styles.questionText}>{card.question}</Text>
              {card.mode === "imageToWord" && card.image && (
                <Video
                  source={{ uri: card.video }}
                  style={styles.video}
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay
                  isLooping
                />
              )}
              {card.mode === "wordToImage" && (
                <>
                  <Text style={styles.wordToImageQuestion}>"{card.answer}"</Text>
                  <Image source={require("../../assets/mimo1.png")} style={styles.icon} resizeMode="contain" />
                </>
              )}
              <Text style={styles.tapText}>Tap to reveal answer</Text>
            </>
          ) : (
            <>
              <Text style={styles.answerLabel}>Answer</Text>
              {card.mode === "imageToWord" && (
                <>
                  <Text style={styles.answerTexts}>{card.answer}</Text>
                  <Text style={styles.answerText}>{card.hint}</Text>
                </>
              )}
              {card.mode === "wordToImage" && card.video && (
                <>
                  <Video
                    source={{ uri: card.video }}
                    style={styles.video}
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay
                    isLooping
                  />
                  <Text style={styles.answertext}>{card.answer}</Text>
                </>
              )}
            </>
          )}
        </Pressable>
      )}

      <View style={styles.tipBox}>
        <Text style={styles.tipText}>Try recalling the sign before revealing the answer.</Text>
      </View>

      <View style={styles.buttonsRow}>
        <Pressable style={[styles.levelButton, styles.againButton]} onPress={() => handleAnswer("again")}>
          <Text style={styles.againText}>Again</Text>
        </Pressable>
        <Pressable style={[styles.levelButton, styles.skipButton]} onPress={() => handleAnswer("skip")}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
        <Pressable style={[styles.levelButton, styles.nextButton]} onPress={() => handleAnswer("next")}>
          <Text style={styles.nextText}>Next</Text>
        </Pressable>
      </View>

      {/* Completion Modal */}
      <Modal visible={showCompleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Lesson Complete 🎉</Text>
            <Pressable onPress={() => { setCurrentCard(0); setShowCompleteModal(false); }}>
              <Text style={styles.modalButton}>Practice again</Text>
            </Pressable>
            <Pressable onPress={() => { setShowCompleteModal(false); router.push("/sign/Flashgrid"); }}>
              <Text style={styles.modalButton}>Exit</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#edf7f0", paddingHorizontal: 20, paddingTop: 15 },
  header: { marginBottom: 30 },
  headerTitle: { fontSize: 25, fontWeight: "700", color: "#1F1F39" },
  subtitle: { fontSize: 15, color: "#8B80F9", marginTop: 4 },
  progressContainer: { marginBottom: 30 },
  progressText: { fontSize: 14, fontWeight: "600", color: "#6E6A7C", marginBottom: 10 },
  progressBarBackground: { height: 10, backgroundColor: "#E6E1FF", borderRadius: 20, overflow: "hidden" },
  progressBarFill: { height: "100%", backgroundColor: "#7ec096", borderRadius: 20 },
  card: {
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 20 },
    elevation: 4,
    minHeight: 300,
    width: "100%",
  },
  wordToImageQuestion: {
    fontSize: 40,
    fontWeight: "800",
    color: "#1F1F39",
    textAlign: "center",
    marginVertical: 20,
    flexShrink: 1,
  },
  icon: { width: 150, height: 100, marginLeft: 0, marginRight: 2 },
  questionText: { fontSize: 25, fontWeight: "700", textAlign: "center", color: "#1F1F39", marginBottom: 5 },
  tapText: { fontSize: 16, color: "#88a6ed", fontWeight: "600", marginTop: 10 },
  answerLabel: { fontSize: 16, color: "#8B80F9", marginBottom: 12, fontWeight: "600" },
  answerTexts: { fontSize: 40, fontWeight: "800", color: "#1F1F39", textAlign: "center", marginBottom: 10 },
  answerText: { fontSize: 30, fontWeight: "500", color: "#7b7b80", textAlign: "center" },
  answertext: { fontSize: 30, fontWeight: "500", color: "#18181b", textAlign: "center" ,marginTop:10},
  tipBox: { backgroundColor: "#e0e5f4", padding: 5, borderRadius: 18, marginTop: 25 },
  tipText: { textAlign: "center", color: "#7C72E8", fontWeight: "500" },
  buttonsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 25, gap: 12 },
  levelButton: { flex: 1, paddingVertical: 16, borderRadius: 18, alignItems: "center", marginBottom: 40 },
  againButton: { backgroundColor: "#FFE5E5" },
  skipButton: { backgroundColor: "#FFF3D9" },
  nextButton: { backgroundColor: "#bbe3d3" },
  againText: { color: "#E05A5A", fontWeight: "700" },
  skipText: { color: "#D18A00", fontWeight: "700" },
  nextText: { color: "#16A34A", fontWeight: "700" },
  video: { width: 200, height: 150, borderRadius: 16, marginTop: 10 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    width: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
  },
  modalButton: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
    marginTop: 10,
  },
});
