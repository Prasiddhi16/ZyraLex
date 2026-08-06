const lesson = {
  id: "vowel_processing",
  title: "Vowel Teams: The Double Agents",
  subtitle: "When two vowels team up, they make a brand new sound! ",
  color: "#E0F2FE", // Light blue theme for Level 2
  mascot: "🦊",
  explanation: [
    {
      type: "text",
      content:
        "When two vowels stand right next to each other, we call them a Vowel Team.",
      animationType: "fade-in-gentle",
      visualAnchor: "ai ea oa",
    },
    {
      type: "story",
      content:
        "Most of the time, the first vowel does the talking, and it says its own long name!",
      animationType: "mirror-flip",
      visualAnchor: "b o a t",
    },
    {
      type: "tip",
      content:
        "In the team 'ea', the 'e' screams its name while 'a' stays completely quiet: /ee/.",
      animationType: "stroke-by-stroke",
      visualAnchor: "t e a m",
    },
    {
      type: "activity",
      content:
        "Say the long vowel team sounds aloud: /ai/ as in rain, and /oa/ as in boat!",
      animationType: "pulse-on-audio",
      visualAnchor: "ai oa",
    },
  ],
  examples: [
    {
      letter: "ai",
      word: "rain",
      emoji: "🌧️",
      sentence: "The r-ai-n falls gently on the roof.",
      color: "#10B981",
    },
    {
      letter: "ea",
      word: "leaf",
      emoji: "🍃",
      sentence: "A green l-ea-f fell from the tree.",
      color: "#10B981",
    },
    {
      letter: "oa",
      word: "boat",
      emoji: "⛵",
      sentence: "The sail b-oa-t glides across the lake.",
      color: "#10B981",
    },
  ],
  guidedPractice: [
    {
      question: "🛶 Which vowel team spells the word b _ _ t?",
      options: ["oa", "ai"],
      answer: "oa",
      interactionType: "tap-to-reveal",
    },
    {
      question: "🍞 Drag the correct vowel team to complete: br _ _ d",
      options: ["ea", "oi"],
      answer: "ea",
      interactionType: "drag-and-drop",
    },
    {
      question: "🌧️ Which vowel team helps you spell 'train'?",
      options: ["ai", "ea"],
      answer: "ai",
      interactionType: "tap-to-reveal",
    },
  ],
  motivationalTips: [
    "🌟 Vowel teams can be tricky, but you are mastering their secret codes!",
    "🌟 Spotting the team first makes reading long words way easier.",
  ],
  completionMessage:
    "Incredible teamwork! You cracked the vowel team combinations! 🏆",
};

export default lesson;
