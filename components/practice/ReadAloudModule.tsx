// components/practice/ReadAloudModule.tsx
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { EvaluationResult } from "../../services/voice";
import ReadAloudCard from "./ReadAloudCard";
import ReadAloudPlayer from "./ReadAloudPlayer";
import ReadAloudRecorder from "./ReadAloudRecorder";

interface ReadAloudModuleProps {
  wordIndex: number;
  totalSentences: number;
  currentEntry: {
    id: number;
    sentence: string;
    words: string[];
  };
  mimoFeedback: {
    title: string;
    message: string;
    borderColor: string;
    textColor: string;
    bgColor: string;
  } | null;
  isSentenceCorrect: boolean;
  onSpeechResult: (
    outcome: EvaluationResult,
    transcript: string,
    accuracy: number
  ) => void;
  onNextWord: () => void;
  onClearFeedback: () => void;
}

export default function ReadAloudModule({
  currentEntry,
  mimoFeedback,
  isSentenceCorrect,
  onSpeechResult,
  onNextWord,
  onClearFeedback,
}: ReadAloudModuleProps) {
  return (
    <View style={s.moduleContainer}>
      <Text style={s.cardTitle}>🗣️ READ ALOUD PRACTICE</Text>

      <ReadAloudCard targetText={currentEntry.sentence} />
      <ReadAloudPlayer targetText={currentEntry.sentence} />
      <ReadAloudRecorder
        targetText={currentEntry.sentence}
        onSpeechResult={onSpeechResult}
      />

      {/* 🐼 Dyslexic-Friendly Mimo Feedback Box */}
      {mimoFeedback && (
        <View style={s.mimoContainer}>
          <Image
            source={require("../../assets/mimoimg.png")}
            style={s.mimoAvatar}
            resizeMode="contain"
          />

          <View
            style={[
              s.speechBubble,
              { borderColor: mimoFeedback.borderColor, backgroundColor: mimoFeedback.bgColor },
            ]}
          >
            <View
              style={[
                s.bubbleArrow,
                { backgroundColor: mimoFeedback.bgColor, borderColor: mimoFeedback.borderColor },
              ]}
            />

            <Text style={[s.feedbackTitle, { color: mimoFeedback.textColor }]}>
              {mimoFeedback.title}
            </Text>
            <Text style={[s.feedbackMessage, { color: mimoFeedback.textColor }]}>
              {mimoFeedback.message}
            </Text>

            {isSentenceCorrect ? (
              <TouchableOpacity style={s.btnNext} onPress={onNextWord}>
                <Text style={s.btnNextText}>Next Sentence ➜</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[s.btnNext, { backgroundColor: "#DC2626" }]} onPress={onClearFeedback}>
                <Text style={s.btnNextText}>Try Again 🔄</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  moduleContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    padding: 18,
    marginBottom: 20,
    gap: 14,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B9EC8",
    letterSpacing: 1,
    marginBottom: 4,
  },
  mimoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 12,
    width: "100%",
  },
  mimoAvatar: {
    width: 75,
    height: 75,
    borderRadius: 14,
  },
  speechBubble: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    position: "relative",
    alignItems: "center",
    gap: 6,
  },
  bubbleArrow: {
    position: "absolute",
    left: -7,
    top: "40%",
    width: 12,
    height: 12,
    transform: [{ rotate: "45deg" }],
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    zIndex: 1,
  },
  feedbackTitle: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  feedbackMessage: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 18,
  },
  btnNext: {
    backgroundColor: "#2563EB",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 4,
  },
  btnNextText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
  },
});