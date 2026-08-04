const level1Decoding = {
  id: "decoding_level1",
  title: "Decoding b and d Sounds",
  subtitle: "Listen closely and blend sounds to read words! 🔊",
  color: "#DBEAFE",
  mascot: "assets/mimo1.png",
  progressColor: "#2563EB",

  introduction: {
    mascotMessage:
      "Hey Sound Detective!  Mimo's here. Today we're unlocking the secret sounds of b and d! When we match their sounds to letters, we can decode all kinds of words. Let's blend!",
  },

  explanation: [
    {
      type: "info",
      content:
        "Every letter makes a special sound! The letter b says /b/ and the letter d says /d/.",
      animationType: "sound-wave",
      visualAnchor: "b → /b/ · d → /d/",
    },
    {
      type: "tip",
      content:
        "To decode a b word, start with /b/, say the vowel, and blend: /b/ - /a/ - /t/ → bat!",
      animationType: "sound-blend",
      visualAnchor: "/b/ + /a/ + /t/",
    },
    {
      type: "tip",
      content:
        "To decode a d word, start with /d/, say the vowel, and blend: /d/ - /o/ - /g/ → dog!",
      animationType: "sound-blend",
      visualAnchor: "/d/ + /o/ + /g/",
    },
    {
      type: "tip",
      content:
        "Press your lips together for /b/! Touch your tongue behind your teeth for /d/! ",
      animationType: "audio-visual-sync",
      visualAnchor: "👄 /b/ · 👅 /d/",
    },
  ],

  examples: [
    {
      emoji: "🚌",
      letter: "b",
      word: "bus",
      sentence: "Blend the sounds: /b/ - /u/ - /s/ → bus!",
      color: "#2563EB",
    },
    {
      emoji: "🔔",
      letter: "b",
      word: "bell",
      sentence: "Blend the sounds: /b/ - /e/ - /l/ → bell!",
      color: "#2563EB",
    },
    {
      emoji: "🐶",
      letter: "d",
      word: "dog",
      sentence: "Blend the sounds: /d/ - /o/ - /g/ → dog!",
      color: "#F59E0B",
    },
    {
      emoji: "🦆",
      letter: "d",
      word: "duck",
      sentence: "Blend the sounds: /d/ - /u/ - /c/ - /k/ → duck!",
      color: "#F59E0B",
    },
  ],

  guidedPractice: [
    {
      interactionType: "tap-to-reveal",
      question:
        "🔊 Which sound does the letter 'b' make at the start of a word?",
      options: ["/b/ like in bus", "/d/ like in dog"],
      answer: "/b/ like in bus",
      successMessage: "Great listening! 'b' makes the /b/ sound! ",
    },
    {
      interactionType: "drag-and-drop",
      question: "Blend the sounds /d/ - /i/ - /g/. Which word did you decode?",
      options: ["dig", "big"],
      answer: "dig",
      successMessage: "Awesome decoding! /d/ - /i/ - /g/ spells dig! ⛏️",
    },
    {
      interactionType: "tap-to-reveal",
      question: "Listen to the word 'bad'. What is its starting sound?",
      options: ["/b/", "/d/"],
      answer: "/b/",
      successMessage: "Spot on! The word 'bad' starts with the /b/ sound!",
    },
    {
      interactionType: "drag-and-drop",
      question: "🎧 Sound out /d/ - /o/ - /t/. Drag the correct decoded word:",
      options: ["dot", "bot"],
      answer: "dot",
      successMessage: "You decoded it! /d/ - /o/ - /t/ spells dot! ",
    },
  ],

  rewards: {
    stars: 5,
    badge: "🎧 Sound Decoder",
    message: "Mystery solved! You earned the official Sound Decoder badge!",
  },

  completionMessage:
    "🎉 Amazing detective work! You can now decode b and d words with confidence. Mimo is doing a happy dance! 🕺",
};

export default level1Decoding;
