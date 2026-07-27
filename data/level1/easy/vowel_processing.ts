const lesson = {
  id: "vowel_processing",
  title: "Vowel Safari: Short Vowels",
  subtitle: "Let's track down short vowel sounds hidden inside words! ",
  color: "#FEF3C7",
  mascot: "🦁",
  explanation: [
    {
      type: "text",
      content:
        "Vowels (A, E, I, O, U) are the secret engines of every single word. They give words their voice!",
      animationType: "fade-in-gentle",
      visualAnchor: "A E I O U",
    },
    {
      type: "story",
      content:
        "Short vowels like to hide between tall consonant sticks. Tracking them helps our eyes read smoothly.",
      animationType: "pulse-on-audio",
      visualAnchor: "c a t",
    },
    {
      type: "tip",
      content:
        "Look closely at the middle! A round 'o' makes a wide sound like a hopping frog: /o/ /o/ /o/.",
      animationType: "stroke-by-stroke",
      visualAnchor: "f r o g",
    },
    {
      type: "activity",
      content:
        "Say the short vowel sounds aloud with Mimo: /a/ as in apple, /i/ as in igloo!",
      animationType: "pulse-on-audio",
      visualAnchor: "a i",
    },
  ],
  examples: [
    {
      letter: "a",
      word: "cat",
      emoji: "🐱",
      sentence: "The c-a-t sat on the mat.",
      color: "#EF4444",
    },
    {
      letter: "o",
      word: "fox",
      emoji: "🦊",
      sentence: "A quick f-o-x hopped over the log.",
      color: "#F59E0B",
    },
    {
      letter: "i",
      word: "fish",
      emoji: "🐟",
      sentence: "The little f-i-sh can swim fast.",
      color: "#3B82F6",
    },
  ],
  guidedPractice: [
    {
      question:
        "Which short vowel is missing in c_p? (Think of a drinking cup!)",
      options: ["a", "u"],
      answer: "u",
      interactionType: "tap-to-reveal",
    },
    {
      question: "Drag the word that has the short /o/ sound",
      options: ["hop", "hip"],
      answer: "hop",
      interactionType: "drag-and-drop",
    },
    {
      question: "Which vowel sits in the middle of 'bag'?",
      options: ["a", "e"],
      answer: "a",
      interactionType: "tap-to-reveal",
    },
  ],
  motivationalTips: [
    "🌟 Your eyes are getting faster at spotting vowels every single day!",
    "🌟 Tracking the middle of the word keeps your reading on target.",
    "🌟 Take your time, hunting for letters is a fun puzzle!",
  ],
  completionMessage:
    "Super Safari Skills! You tracked down those short vowels!",
};

export default lesson;
