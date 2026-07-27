import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

interface ProgressBarProps {
  completed: number;
  total: number;
   label?: string|null ; 
  fillColor?: string;
  trackColor?: string;
  height?: number;
}

/**
 * Reusable horizontal progress bar with a smooth animated fill.
 * completed/total are turned into a 0-100% width that animates
 * whenever either value changes.
 */
export default function ProgressBar({
  completed,
  total,
  label,
  fillColor = "#2563EB",
  trackColor = "#E2E8F0",
  height = 8,
}: ProgressBarProps) {
  const safeTotal = total > 0 ? total : 1;
  const percentage = Math.round(Math.min(completed / safeTotal, 1) * 100);

  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: percentage,
      duration: 350,
      useNativeDriver: false, // width can't use the native driver
    }).start();
  }, [percentage, widthAnim]);

  const animatedWidth = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.wrapper}>
      <View style={[styles.track, { backgroundColor: trackColor, height }]}>
        <Animated.View
          style={[styles.fill, { backgroundColor: fillColor, width: animatedWidth, height }]}
        />
      </View>
      <Text style={styles.label}>
        {label ?? `${completed}/${total} • ${percentage}%`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: "100%", marginTop: 6 },
  track: { width: "100%", borderRadius: 999, overflow: "hidden" },
  fill: { borderRadius: 999 },
  label: {
    fontSize: 10,
    color: "#6B9EC8",
    marginTop: 3,
    textAlign: "center",
    fontWeight: "600",
  },
});