const lesson = {
  id: "chunking",
  title: "Chunking Words",
  subtitle: "Let's break big words into smaller easy chunks!",
  color: "#DCFCE7",
  mascot: "🦜",
  explanation: [
    {
      type: "text",
      content: "Chunking means breaking a long word into smaller parts.",
    },
    {
      type: "text",
      content: "Small chunks are easier for our brain to read and remember.",
      animationType: "pulse-on-audio",
      visualAnchor: "chunk",
    },
    {
      type: "story",
      content: "Basketball can become bas-ket-ball 🏀",
      animationType: "stroke-by-stroke",
      visualAnchor: "bas-ket-ball",
    },
    {
      type: "tip",
      content: "Look for small words you already know inside big words.",
      animationType: "mirror-flip",
      visualAnchor: "sun",
    },
    {
      type: "activity",
      content: "Clap your hands for each chunk while reading 👏",
      visualAnchor: "clap",
    },
  ],
  examples: [
    {
      letter: "sun",
      word: "sunflower",
      emoji: "🌻",
      sentence: "Sun-flower has two chunks.",
      color: "#EAB308",
    },
    {
      letter: "foot",
      word: "football",
      emoji: "⚽",
      sentence: "Foot-ball has two easy chunks.",
      color: "#22C55E",
    },
    {
      letter: "rain",
      word: "raincoat",
      emoji: "🧥",
      sentence: "Rain-coat can be read chunk by chunk.",
      color: "#3B82F6",
    },
  ],
  guidedPractice: [
    {
      interactionType: "tap-to-reveal",
      question: "🌈 How would you chunk 'rainbow'?",
      options: ["rain-bow", "ra-in-bow", "rain-b-ow"],
      answer: "rain-bow",
    },
    {
      interactionType: "drag-and-drop",
      question: "🧁 Which is the correct chunking for 'cupcake'?",
      options: ["cup-cake", "cu-pcake", "cupc-ake"],
      answer: "cup-cake",
    },
    {
      interactionType: "tap-to-reveal",
      question: "🌅 How would you chunk 'sunset'?",
      options: ["sun-set", "su-nset", "s-uns-et"],
      answer: "sun-set",
    },
  ],
  completionMessage:
    "Excellent work! 🎉 You are learning to break big words into small chunks!",
};

export default lesson;
