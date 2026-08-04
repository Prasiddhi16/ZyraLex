import { Lesson } from '@/types/lesson';
import React from 'react';
import {
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../constants/colors';

interface LessonCardProps {
  lesson: Lesson;
  onPress?: (event: GestureResponderEvent) => void;
  completed?: boolean;
}

export const PracticeCard: React.FC<LessonCardProps> = ({
  lesson,
  onPress,
  completed = false,
}) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{lesson.title}</Text>

        <Text style={styles.description}>
          {lesson.descriptionpractice}
        </Text>
      </View>

      <View
        style={[
          styles.moreButton,
          completed && styles.completedButton,
        ]}
      >
        <Text style={styles.moreButtonText}>
          {completed ? "✓" : "•••"}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.cream,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  content: {
    flex: 1,
    marginRight: 12,
  },

  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 4,
  },

  description: {
    fontSize: 13,
    color: COLORS.darkGray,
    marginBottom: 10,
  },

  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  completedButton: {
    backgroundColor: '#28A745',
  },

  moreButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});