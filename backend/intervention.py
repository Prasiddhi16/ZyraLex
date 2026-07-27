import re


class InterventionEngine:
    def __init__(self):
        self.custom_dictionary = {
            "dyslexia": ["dys", "lex", "i", "a"],
            "intervention": ["in", "ter", "ven", "tion"],
            "reading": ["read", "ing"]
        }

    def get_syllables(self, word):
        clean_word = re.sub(r'[^\w]', '', word).lower()
        if clean_word in self.custom_dictionary:
            return self.custom_dictionary[clean_word]
        # single letters
        if len(clean_word) <= 1:
            return [clean_word]

        syllables = re.findall(r'(?:[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?)', clean_word)
        return syllables if syllables else [word]

    def format_syllable_breakdown(self, word, style="hyphen"):
        syllables = self.get_syllables(word)
        if style == "hyphen":
            return "-".join(syllables)
        elif style == "color":
            colors = ["#FF4B4B", "#1C6DD0"]
            colored_word = ""
            for i, syl in enumerate(syllables):
                color = colors[i % 2]
                colored_word += f'<span style="color: {color}; font-weight: bold;">{syl}</span>'
            return colored_word
        return word

    def apply_bionic_reading(self, text):
        words = text.split()
        bionic_words = []
        for word in words:
            clean_word = re.sub(r'[^\w]', '', word)
            if not clean_word:
                bionic_words.append(word)
                continue
            mid = max(1, len(clean_word) // 2)
            if len(clean_word) <= 3:
                mid = 1
            bold_part = word[:mid]
            rest_part = word[mid:]
            bionic_words.append(f"<b>{bold_part}</b>{rest_part}")
        return " ".join(bionic_words)

    def trigger_audio_cue(self, word):
        return {
            "action": "PLAY_AUDIO",
            "text_to_speak": word,
            "rate": 0.75
        }


if __name__ == "__main__":
    print("---Testing ZyraLex Intervention Engine --- \n")
    engine = InterventionEngine()
    test_word_1 = "dyslexia"
    print(f"Original: {test_word_1}")
    print(f"Syllable (Hyphen): {engine.format_syllable_breakdown(test_word_1, style='hyphen')}\n")

    test_word_2 = "intervention"
    print(f"Original: {test_word_2}")
    print(f"Syllable (HTML Color): {engine.format_syllable_breakdown(test_word_2, style='color')}\n")

    sample_sentence = "The student is fixating on a single word for too long."
    print(f"Original Sentence: {sample_sentence}")
    print(f"Bionic Version:    {engine.apply_bionic_reading(sample_sentence)}\n")

    print("Audio Payload Generation:")
    print(engine.trigger_audio_cue("fixation"))