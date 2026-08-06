import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

type Practice = {
  question: string;
  options: string[];
  answer: string;
};

interface DragDropCardProps {
  practice: Practice;
  onAnswer: (selected: string, correct: string) => void;
  onSpeak: (text: string) => void; 
}

function DraggableTile({
  label,
  index,
  dropZoneRef,
  disabled,
  onDrop,
}: {
  label: string;
  index: number;
  dropZoneRef: React.RefObject<View | null>;
  disabled: boolean;
  onDrop: (label: string) => void;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const grabScale = useSharedValue(1);
  const entranceScale = useSharedValue(0);

  useEffect(() => {
    entranceScale.value = withDelay(
      index * 100,
      withSpring(1, { damping: 8, stiffness: 140 }),
    );
  }, []);

  const checkDrop = (absX: number, absY: number) => {
    if (!dropZoneRef.current) return;

    dropZoneRef.current.measureInWindow((x, y, width, height) => {
      const inside =
        absX >= x && absX <= x + width && absY >= y && absY <= y + height;

      if (inside) {
        runOnJS(onDrop)(label);
      } else {
        translateX.value = withSpring(0, { damping: 10, stiffness: 150 });
        translateY.value = withSpring(0, { damping: 10, stiffness: 150 });
        grabScale.value = withSpring(1);
      }
    });
  };

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
      grabScale.value = withSpring(1.12, { damping: 8, stiffness: 200 });
    })
    .onUpdate((e) => {
      translateX.value = startX.value + e.translationX;
      translateY.value = startY.value + e.translationY;
    })
    .onEnd((e) => {
      grabScale.value = withSpring(1);
      runOnJS(checkDrop)(e.absoluteX, e.absoluteY);
    });

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: entranceScale.value * grabScale.value },
    ],
    zIndex: disabled ? 1 : 999,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[styles.tile, style, disabled && styles.tileDisabled]}
      >
        <Text style={styles.tileText}>{label}</Text>
      </Animated.View>
    </GestureDetector>
  );
}

export default function DragDropCard({
  practice,
  onAnswer,
  onSpeak,
}: DragDropCardProps) {
  const dropZoneRef = useRef<View>(null);
  const [dropped, setDropped] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);

  const zoneScale = useSharedValue(1);
  const zoneShake = useSharedValue(0);

  const handleDrop = (label: string) => {
    if (locked) return;
    const correct = label === practice.answer;
    setDropped(label);
    setLocked(true);
    setWasCorrect(correct);

    if (correct) {
      zoneScale.value = withSequence(
        withTiming(1.08, { duration: 150 }),
        withSpring(1, { damping: 7, stiffness: 160 }),
      );
    } else {
      zoneShake.value = withSequence(
        withTiming(-8, { duration: 80 }),
        withTiming(8, { duration: 80 }),
        withTiming(-5, { duration: 80 }),
        withTiming(0, { duration: 80 }),
      );
    }

    setTimeout(() => onAnswer(label, practice.answer), 260);
  };

  const zoneStyle = useAnimatedStyle(() => ({
    transform: [{ scale: zoneScale.value }, { translateX: zoneShake.value }],
  }));

  const zoneColor =
    wasCorrect === null
      ? styles.dropZone
      : wasCorrect
        ? styles.dropZoneCorrect
        : styles.dropZoneWrong;

  return (
    <View style={styles.card}>
      <Text style={styles.question}>{practice.question}</Text>

      <Text style={styles.subhint}>
        Drag the correct card into the box below
      </Text>

      <Animated.View ref={dropZoneRef} style={[zoneColor, zoneStyle]}>
        <Text style={styles.dropZoneText}>
          {dropped ? dropped : "Drop here"}
        </Text>
      </Animated.View>

      <View style={styles.tileRow}>
        {practice.options.map((option, index) => (
          <DraggableTile
            key={index}
            label={option}
            index={index}
            dropZoneRef={dropZoneRef}
            disabled={locked}
            onDrop={handleDrop}
          />
        ))}
      </View>
      <TouchableOpacity
        style={styles.audioButton}
        onPress={() => onSpeak(practice.question)}
      >
        <Ionicons name="volume-high" size={20} color="white" />
        <Text style={styles.audioButtonText}>Hear It</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
  question: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    color: "#1E293B",
    lineHeight: 34,
    textAlign: "center",
  },
  audioButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    alignSelf: "center",
    marginBottom: 16,
    width: "70%",
  },
  audioButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  subhint: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 20,
  },
  dropZone: {
    height: 90,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: "#93C5FD",
    borderStyle: "dashed",
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  dropZoneCorrect: {
    height: 90,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: "#28A745",
    backgroundColor: "#D4EDDA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  dropZoneWrong: {
    height: 90,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: "#FFC107",
    backgroundColor: "#FFF3CD",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  dropZoneText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2563EB",
  },
  tileRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  tile: {
    width: 100,
    height: 100,
    backgroundColor: "#F1F5F9",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#CBD5E1",
  },
  tileDisabled: {
    opacity: 0.5,
  },
  tileText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#334155",
  },
});
