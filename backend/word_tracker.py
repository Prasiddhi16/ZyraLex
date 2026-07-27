import time
import re
from intervention import InterventionEngine


class WordTracker:
    def __init__(self, distraction_threshold=15.0, fixation_threshold=2.5):
        self.distraction_threshold = distraction_threshold
        self.fixation_threshold = fixation_threshold
        self.word_struggle_counts = {}
        self.last_seen_time = time.time()
        self.current_word_index = None
        self.word_hover_start_time = None
        self.words_metadata = []
        self.intervention = InterventionEngine()

    def load_text_coordinates(self, words_with_boxes):
        self.words_metadata = words_with_boxes

    def syllable_breakdown(self, word):
        broken_word = self.intervention.format_syllable_breakdown(word, style="hyphen")
        if "-" not in broken_word:
            return "-".join(list(word))
        return broken_word

    def update_gaze(self, gaze_x, gaze_y, face_detected=True):
        current_time = time.time()

        if not face_detected:
            if current_time - self.last_seen_time > self.distraction_threshold:
                self.last_seen_time = current_time
                return {
                    "status": "distracted",
                    "sel_message": "Hey! Lost your place? No worries — let's jump back in! 😊",
                }
            return None

        self.last_seen_time = current_time
        looking_at_word_idx = None
        for idx, w in enumerate(self.words_metadata):
            if w['x1'] <= gaze_x <= w['x2'] and w['y1'] <= gaze_y <= w['y2']:
                looking_at_word_idx = idx
                break

        if looking_at_word_idx is not None:
            if self.current_word_index != looking_at_word_idx:
                self.current_word_index = looking_at_word_idx
                self.word_hover_start_time = current_time
                return None

            duration = current_time - self.word_hover_start_time
            if duration >= self.fixation_threshold:
                target_word = self.words_metadata[looking_at_word_idx]['word']
                broken_word = self.syllable_breakdown(target_word)
                self.word_struggle_counts[target_word] = (
                    self.word_struggle_counts.get(target_word, 0) + 1
                )
                struggle_count = self.word_struggle_counts[target_word]
                status = "struggling" if struggle_count >= 3 else "fixated"
                self.word_hover_start_time = current_time  # Reset tracking timer
                return {
                    "status": status,
                    "word": target_word,
                    "syllables": broken_word,
                    "struggle_count": struggle_count,
                    "sel_message": f"Hi, this is the word {target_word} and it's pronounced as {target_word}.",
                }
            return None
        else:
            self.current_word_index = None
            self.word_hover_start_time = None
            return None