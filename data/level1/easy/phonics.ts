const lesson = {
  id: "phonics",
  title: "Phonics Adventure",
  subtitle:
    "Become a Sound Detective! Listen, look, speak and play with sounds!",
  color: "#FEF3C7",
  mascot: "assets/mimo1.png",
  progressColor: "#F59E0B",

  introduction: {
    mascotMessage:
      "Hi! I'm Mimo. Today we're meeting two super sound teammates: CH and SH. Let's solve some mysteries together!",
  },
  seeIt: {
    title: "Look Carefully",
    instruction:
      "Tap each card to watch the sounds transform! CH is strong, SH is super quiet.",
    cards: [
      {
        sound: "CH",
        emoji: "🚂",
        word: "Chair",
        description: "CH sounds like a speedy steam train going CHOO CHOO!",
        animationType: "pulse-on-audio",
        visualAnchor: "CH 🚂",
        cardColor: "#FEE2E2",
      },
      {
        sound: "SH",
        emoji: "🤫",
        word: "Ship",
        description: "SH sounds like a soft, magical whisper... SHHH!",
        animationType: "stroke-by-stroke",
        visualAnchor: "SH 🤫",
        cardColor: "#E0F2FE",
      },
    ],
  },
  hearIt: {
    title: "👂 Listen Carefully",
    instruction:
      "Tap Mimo to hear the secret sound, then pick the matching card!",
    rounds: [
      {
        audio: "ch",
        answer: "CH",
        options: ["CH", "SH"],
        interactionType: "tap-to-reveal",
        successMessage: "Whoosh! You have the ears of a true detective! 🚂",
      },
      {
        audio: "sh",
        answer: "SH",
        options: ["CH", "SH"],
        interactionType: "tap-to-reveal",
        successMessage: "Awesome! You caught that quiet whisper sound! 🤫",
      },
    ],
  },
  sayIt: {
    title: "🗣 Say the Sound",
    instruction: "Say each sound out loud into your space with Mimo!",
    rounds: [
      {
        expected: "CH",
        hint: "Open your mouth wide and make it snappy: CH-CH-CH! 💥",
        animationType: "pulse-on-audio",
        visualAnchor: "CH",
      },
      {
        expected: "SH",
        hint: "Put one finger near your lips and whisper softly: SHHH... 🤫",
        animationType: "stroke-by-stroke",
        visualAnchor: "SH",
      },
    ],
  },
  traceIt: {
    title: "✍ Trace the Magic Letters",
    instruction:
      "Follow the ghost lines slowly with your finger to lock the shapes into your memory!",
    items: [
      {
        text: "CH",
        color: "#EF4444",
        guideHint: "Start from the top for the C, then build your tall H!",
      },
      {
        text: "SH",
        color: "#3B82F6",
        guideHint: "Curve like a little snake for the S, then drop down the H!",
      },
    ],
  },

  buildIt: {
    title: " Build the Word",
    instruction:
      "Pop the missing sound team into the blank space to save the word!",
    rounds: [
      {
        image: "🪑",
        word: "__air",
        answer: "CH",
        options: ["CH", "SH"],
        interactionType: "drag-and-drop",
        successMessage: "Perfect! You built the CH-air! 🪑",
      },
      {
        image: "🐑",
        word: "__eep",
        answer: "SH",
        options: ["CH", "SH"],
        interactionType: "drag-and-drop",
        successMessage: "Baaah! The SH-eep is happy now! 🐑",
      },
      {
        image: "🧀",
        word: "__eese",
        answer: "CH",
        options: ["CH", "SH"],
        interactionType: "drag-and-drop",
        successMessage: "Yum! Say CH-eese! 🧀",
      },
    ],
  },
  playTime: {
    type: "sorting",
    title: "🎮 Help Mimo Sort the Words",
    instruction:
      "Fling or drag each moving word into its matching sound bucket!",
    categories: ["CH", "SH"],
    words: [
      { word: "chair", answer: "CH", emoji: "🪑" },
      { word: "cheese", answer: "CH", emoji: "🧀" },
      { word: "chicken", answer: "CH", emoji: "🐔" },
      { word: "ship", answer: "SH", emoji: "🚢" },
      { word: "shoe", answer: "SH", emoji: "👟" },
      { word: "sheep", answer: "SH", emoji: "🐑" },
    ],
  },

  explanation: [
    {
      type: "story",
      content:
        "CH is a bright, loud train engine. SH is a quiet, peaceful ocean whisper.",
      animationType: "pulse-on-audio",
      visualAnchor: "CH  vs SH ",
    },
    {
      type: "story",
      content: "Can your detective ears pick up the difference between them?",
      animationType: "stroke-by-stroke",
      visualAnchor: "🔍 SOUND TEST",
    },
  ],

  examples: [
    {
      letter: "CH",
      word: "chair",
      emoji: "🪑",
      sentence: "The CH-air makes a solid sound!",
      color: "#EF4444",
    },
    {
      letter: "CH",
      word: "cheese",
      emoji: "🧀",
      sentence: "Mice love to nibble yellow CH-eese!",
      color: "#EF4444",
    },
    {
      letter: "SH",
      word: "ship",
      emoji: "🚢",
      sentence: "The big SH-ip sails smoothly across the deep blue sea.",
      color: "#3B82F6",
    },
    {
      letter: "SH",
      word: "shoe",
      emoji: "👟",
      sentence: "Tie up your SH-oe lace tight before you sprint!",
      color: "#3B82F6",
    },
  ],

  guidedPractice: [
    {
      interactionType: "tap-to-reveal",
      question: "Which sound teammate starts the word CHAIR?",
      options: ["CH", "SH"],
      answer: "CH",
    },
    {
      interactionType: "drag-and-drop",
      question: "Which soft sound teammate starts the word SHIP?",
      options: ["CH", "SH"],
      answer: "SH",
    },
    {
      interactionType: "tap-to-reveal",
      question: "Tap the delicious snack that starts with the CH sound!",
      options: ["Cheese", "Ship"],
      answer: "Cheese",
    },
  ],

  rewards: {
    stars: 3,
    badge: "🎵 Sound Detective",
    message:
      "Sensational tracking! You earned the official Sound Detective badge!",
  },

  completionMessage:
    "🎉 Spectacular job, Sound Detective! You can now confidently see, trace, hear, and say CH and SH sound teams perfectly! Keep shining!",
};

export default lesson;
