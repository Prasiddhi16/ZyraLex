const lesson = {
  id: "letter_reversal",
  title: "Learning b and d",
  subtitle:
    "Let's learn how these letters face different directions in a fun way!",
  color: "#DBEAFE",
  mascot: "🐼",

  explanation: [
    {
      type: "text",
      content:
        "Sometimes letters like b and d can look confusing. That is completely okay.",
      animationType: "fade-in-gentle",
      visualAnchor: "b d",
    },
    {
      type: "story",
      content:
        "Many learners mix up these letters because they are mirror twins",
      animationType: "mirror-flip",
      visualAnchor: "b",
    },
    {
      type: "story",
      content:
        "Many learners mix up these letters because they are mirror twins",
      animationType: "mirror-flip",
      visualAnchor: "d",
    },

    {
      type: "tip",
      content: "The letter b has the stick first, then the belly → b",
      animationType: "stroke-by-stroke",
      visualAnchor: "l+o -> b",
    },
    {
      type: "tip",
      content: "The letter b has the stick first, then the belly → b",
      animationType: "stroke-by-stroke",
      visualAnchor: "o+l -> d",
    },
    {
      type: "activity",
      content: "Trace the letters slowly with your finger",
      animationType: "follow-the-dot",
      visualAnchor: "b",
    },
    {
      type: "activity",
      content: "Say the sounds aloud: /b/ /b/ /b/ and /d/ /d/ /d/",
      animationType: "pulse-on-audio",
      visualAnchor: "b d",
    },
  ],

  examples: [
    {
      letter: "b",
      word: "ball",
      emoji: "⚽",
      sentence: "B-all starts with the /b/ sound.",
      color: "#2563EB",
    },
    {
      letter: "b",
      word: "banana",
      emoji: "🍌",
      sentence: "B-anana starts with the /b/ sound.",
      color: "#2563EB",
    },
    {
      letter: "d",
      word: "dog",
      emoji: "🐶",
      sentence: "D-og starts with the /d/ sound.",
      color: "#F59E0B",
    },
    {
      letter: "d",
      word: "door",
      emoji: "🚪",
      sentence: "D-oor starts with the /d/ sound.",
      color: "#F59E0B",
    },
  ],

  guidedPractice: [
    {
      question: " Which letter is b?",
      options: ["b", "d"],
      answer: "b",
      interactionType: "tap-to-reveal",
    },
    {
      question: "Drag the word that starts with d",
      options: ["dog", "ball"],
      answer: "dog",
      interactionType: "drag-and-drop",
    },
    {
      question: " Which word starts with b?",
      options: ["banana", "door"],
      answer: "banana",
      interactionType: "tap-to-reveal",
    },
    {
      question: " Drag the letter d into the box",
      options: ["b", "d"],
      answer: "d",
      interactionType: "drag-and-drop",
    },
  ],

  motivationalTips: [
    "🌟 Mistakes help your brain grow stronger.",
    "🌟 You are improving every time you practice.",
    "🌟 Slow reading is smart reading.",
  ],

  completionMessage:
    "Amazing work! You are getting better at recognizing b and d! ",
};

export default lesson;
