// components/practice/ReadAloudRecorder.tsx
import { Mic, Square } from "lucide-react-native";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { EvaluationResult, startListening, stopListening } from "../../services/voice";

interface ReadAloudRecorderProps {
  targetText: string;
  onSpeechResult: (
    outcome: EvaluationResult,
    transcript: string,
    accuracy: number
  ) => void;
}

export default function ReadAloudRecorder({
  targetText,
  onSpeechResult,
}: ReadAloudRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [spokenText, setSpokenText] = useState("");

  const handleToggleRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      setSpokenText("");

      startListening({
        targetText,
        onTranscriptUpdate: (text) => setSpokenText(text),
        onComplete: () => {},
      });
    } else {
      setIsRecording(false);
      const { result, transcript, accuracy } = stopListening(targetText);
      onSpeechResult(result, transcript, accuracy);
    }
  };

  return (
    <View style={s.container}>
      {isRecording && (
        <Text style={s.liveTranscript}>
          Tracking: <Text style={s.italic}>"{spokenText || "Listening..."}"</Text>
        </Text>
      )}

      <TouchableOpacity
        style={[s.btnSpeak, isRecording && s.btnRecording]}
        onPress={handleToggleRecord}
        activeOpacity={0.7}
      >
        {isRecording ? (
          <>
            <Square size={16} color="#DC2626" />
            <Text style={[s.btnSpeakText, { color: "#DC2626" }]}>Stop & Evaluate</Text>
          </>
        ) : (
          <>
            <Mic size={16} color="#2563EB" />
            <Text style={s.btnSpeakText}>Speak Word</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { width: "100%", gap: 12, alignItems: "center" },
  btnSpeak: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#2563EB",
  },
  btnRecording: {
    borderColor: "#DC2626",
    backgroundColor: "#FEF2F2",
  },
  btnSpeakText: { fontSize: 15, fontWeight: "600", color: "#2563EB" },
  liveTranscript: { fontSize: 14, color: "#4B5563", textAlign: "center" },
  italic: { fontStyle: "italic", color: "#1F2937" },
});