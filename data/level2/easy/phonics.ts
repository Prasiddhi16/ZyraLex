const level2Phonics = {
  id: "level2_phonics",
  title: "Advanced Phonics",
  subtitle:
    "Learn more complex sounds and blend letter teammates together! ",
  color: "#E0F2FE",
  mascot: "assets/mimo1.png",
  progressColor: "#2563EB",

  introduction: {
    mascotMessage:
      "Welcome back, Sound Detective! Mimo is here. Let's find out how secret blend pairs like 'tr' and 'dr' change how we read words!",
  },
  explanation: [
    {
      type: "info",
      content:
        "Phonics maps out the secret lines that connect letter symbols straight to spoken sounds!",
      animationType: "pulse-on-audio",
      visualAnchor: "🔤 CONNECT",
    },
    {
      type: "tip",
      content:
        "When two distinct letter blocks stand next to each other, they work together like teammates to form a fresh sound blend!",
      animationType: "morph-asset",
      visualAnchor: "t + r ➔ tr",
    },
    {
      type: "tip",
      content:
        "Listen closely to 'sh' — it locks together to make a clean, continuous whisper: shhhhh! 🤫",
      animationType: "morph-asset",
      visualAnchor: "sh 🦈",
    },
  ],

  examples: [
    {
      emoji: "🦈",
      letter: "sh",
      word: "shark",
      sentence:
        "The SH-ark zooms gracefully through the deep blue ocean water.",
      color: "#2563EB",
    },
    {
      emoji: "🪑",
      letter: "ch",
      word: "chair",
      sentence: "Pull up the wooden CH-air to join our workspace table.",
      color: "#DC2626",
    },
    {
      emoji: "🚂",
      letter: "tr",
      word: "train",
      sentence: "The steel TR-ain chugs swiftly down the winding tracks.",
      color: "#16A34A",
    },
    {
      emoji: "🌧️",
      letter: "dr",
      word: "drip",
      sentence: "Cool, crystal clear water drops DR-ip down slowly.",
      color: "#7C3AED",
    },
  ],

  guidedPractice: [
    {
      interactionType: "tap-to-reveal",
      question:
        "🦈 Which powerful sound blend teammate starts the word 'shark'?",
      options: ["sh", "ch", "dr"],
      answer: "sh",
      successMessage: "Splendid tracking! SH-ark starts with 'sh'! 🌊",
    },
    {
      interactionType: "tap-to-reveal",
      question:
        "🪑 Look around! Which target object word starts right up with 'ch'?",
      options: ["chair", "train", "drip"],
      answer: "chair",
      successMessage: "Awesome reading! CH-air is exactly right! 🪑",
    },
    {
      interactionType: "drag-and-drop",
      question:
        "🚂 Inspect the puzzle! Which blended block pair hides inside 'train'?",
      options: ["tr", "sh", "ch", "fg"],
      answer: "tr",
      successMessage: "Boom! TR-ain combines T and R perfectly! 🚂",
    },
    {
      interactionType: "drag-and-drop",
      question:
        "🌧️ Listen to the drop sound! Which action word starts with a 'dr' blend?",
      options: ["drip", "chair", "shark"],
      answer: "drip",
      successMessage: "Fantastic! DR-ip has that clear starting blend! 💧",
    },
  ],

  rewards: {
    stars: 5,
    badge: "🚀 Blend Master",
    message:
      "Incredible decoding! You unlocked the Advanced Blend Master Badge! 🎖️",
  },

  completionMessage:
    "Awesome! You conquered Level 2 Advanced Phonics and mastered complex letter blending! Mimo is cheering for you! 🏆🎉",
};

export default level2Phonics;
