// data/practice/advanced/lessonPractice.ts

import { SyllableChallenge, WordChallenge } from '../beginner/lessonPractice';
import { LetterRecognitionQuestion } from '../types';

// Declaring this locally breaks the circular import chain entirely!
export interface LessonDataStructure {
  letterRecognition: LetterRecognitionQuestion[];
  simpleWords: WordChallenge[];
  syllableBasics: SyllableChallenge[];
}

export const ADVANCED_LESSON_DATA: LessonDataStructure = {
  letterRecognition: [
    // --- TYPE 1: containsLetter (14 Questions) ---
    { id: "alr_1", type: "containsLetter", instruction: "Find the word containing letter B", voicePrompt: "Find the word containing the letter B", target: "B", choices: ["Cat", "Bed", "Sun", "Dog"], correctAnswer: "Bed", rewardMessage: "Fantastic scanning!" },
    { id: "alr_2", type: "containsLetter", instruction: "Find the word containing letter M", voicePrompt: "Which word contains the letter M?", target: "M", choices: ["Moon", "Cat", "Pig", "Sun"], correctAnswer: "Moon", rewardMessage: "Superb word hunting!" },
    { id: "alr_3", type: "containsLetter", instruction: "Find the word containing letter G", voicePrompt: "Find the word containing letter G", target: "G", choices: ["Fox", "Box", "Frog", "Hen"], correctAnswer: "Frog", rewardMessage: "Excellent detection!" },
    { id: "alr_4", type: "containsLetter", instruction: "Find the word containing letter K", voicePrompt: "Which word contains the letter K?", target: "K", choices: ["Duck", "Fish", "Bird", "Lion"], correctAnswer: "Duck", rewardMessage: "You nailed it!" },
    { id: "alr_5", type: "containsLetter", instruction: "Find the word containing letter R", voicePrompt: "Find the word containing letter R", target: "R", choices: ["Lamp", "Bird", "Milk", "Tent"], correctAnswer: "Bird", rewardMessage: "Magnificent word scan!" },
    { id: "alr_6", type: "containsLetter", instruction: "Find the word containing letter L", voicePrompt: "Which word contains the letter L?", target: "L", choices: ["Ship", "Nest", "Lamp", "Fire"], correctAnswer: "Lamp", rewardMessage: "Awesome tracking!" },
    { id: "alr_7", type: "containsLetter", instruction: "Find the word containing letter S", voicePrompt: "Find the word containing letter S", target: "S", choices: ["Fish", "Tree", "Boat", "Cake"], correctAnswer: "Fish", rewardMessage: "Sensational!" },
    { id: "alr_8", type: "containsLetter", instruction: "Find the word containing letter H", voicePrompt: "Which word contains the letter H?", target: "H", choices: ["Shark", "Kite", "Zebra", "Apple"], correctAnswer: "Shark", rewardMessage: "Perfect context grasp!" },
    { id: "alr_9", type: "containsLetter", instruction: "Find the word containing letter P", voicePrompt: "Find the word containing letter P", target: "P", choices: ["Train", "House", "Grape", "Clock"], correctAnswer: "Grape", rewardMessage: "Deliciously accurate!" },
    { id: "alr_10", type: "containsLetter", instruction: "Find the word containing letter C", voicePrompt: "Which word contains the letter C?", target: "C", choices: ["Spoon", "Clock", "Snake", "House"], correctAnswer: "Clock", rewardMessage: "Exceptional!" },
    { id: "alr_11", type: "containsLetter", instruction: "Find the word containing letter Z", voicePrompt: "Find the word containing letter Z", target: "Z", choices: ["Zebra", "Robot", "Apple", "Spoon"], correctAnswer: "Zebra", rewardMessage: "Brilliant check!" },
    { id: "alr_12", type: "containsLetter", instruction: "Find the word containing letter V", voicePrompt: "Which word contains the letter V?", target: "V", choices: ["Garden", "Winter", "Silver", "Rabbit"], correctAnswer: "Silver", rewardMessage: "Way to shine!" },
    { id: "alr_13", type: "containsLetter", instruction: "Find the word containing letter X", voicePrompt: "Find the word containing letter X", target: "X", choices: ["Doctor", "Explosion", "Pencil", "Basket"], correctAnswer: "Explosion", rewardMessage: "Boom! Brilliant find!" },
    { id: "alr_14", type: "containsLetter", instruction: "Find the word containing letter Y", voicePrompt: "Which word contains the letter Y?", target: "Y", choices: ["Purple", "Yellow", "Orange", "Tomato"], correctAnswer: "Yellow", rewardMessage: "Terrific work!" },

    // --- TYPE 2: startsWith (13 Questions) ---
    { id: "alr_15", type: "startsWith", instruction: "Which word starts with D?", voicePrompt: "Which word starts with D?", target: "D", choices: ["Dog", "Cat", "Pig", "Bat"], correctAnswer: "Dog", rewardMessage: "Fabulous structural start!" },
    { id: "alr_16", type: "startsWith", instruction: "Which word starts with F?", voicePrompt: "Find the word that starts with F", target: "F", choices: ["Frog", "Duck", "Bird", "Lion"], correctAnswer: "Frog", rewardMessage: "Wonderful focus!" },
    { id: "alr_17", type: "startsWith", instruction: "Which word starts with L?", voicePrompt: "Which word starts with L?", target: "L", choices: ["Lamp", "Milk", "Tent", "Nest"], correctAnswer: "Lamp", rewardMessage: "Bright identification!" },
    { id: "alr_18", type: "startsWith", instruction: "Find the word starting with N", voicePrompt: "Find the word starting with N", target: "N", choices: ["Nest", "Star", "Tree", "Fire"], correctAnswer: "Nest", rewardMessage: "Cozy and perfect!" },
    { id: "alr_19", type: "startsWith", instruction: "Which word starts with S?", voicePrompt: "Which word starts with S?", target: "S", choices: ["Ship", "Moon", "Boat", "Cake"], correctAnswer: "Ship", rewardMessage: "Sailing smoothly!" },
    { id: "alr_20", type: "startsWith", instruction: "Find the word that starts with K", target: "K", choices: ["Kite", "Apple", "Robot", "Shark"], voicePrompt: "Find the word that starts with K", correctAnswer: "Kite", rewardMessage: "Flying high!" },
    { id: "alr_21", type: "startsWith", instruction: "Which word starts with R?", voicePrompt: "Which word starts with R?", target: "R", choices: ["Robot", "Snake", "Grape", "Spoon"], correctAnswer: "Robot", rewardMessage: "Super systematic!" },
    { id: "alr_22", type: "startsWith", instruction: "Find the word starting with H", voicePrompt: "Find the word starting with H", target: "H", choices: ["House", "Train", "Zebra", "Clock"], correctAnswer: "House", rewardMessage: "Great anchoring!" },
    { id: "alr_23", type: "startsWith", instruction: "Which word starts with W?", voicePrompt: "Which word starts with W?", target: "W", choices: ["Winter", "Garden", "Rabbit", "Flower"], correctAnswer: "Winter", rewardMessage: "Brrr-illiant step!" },
    { id: "alr_24", type: "startsWith", instruction: "Find the word starting with P", voicePrompt: "Find the word starting with P", target: "P", choices: ["Pencil", "Window", "Basket", "Butter"], correctAnswer: "Pencil", rewardMessage: "Sharp reading!" },
    { id: "alr_25", type: "startsWith", instruction: "Which word starts with C?", voicePrompt: "Which word starts with C?", target: "C", choices: ["Candle", "Doctor", "Pocket", "Rocket"], correctAnswer: "Candle", rewardMessage: "Glowing clarity!" },
    { id: "alr_26", type: "startsWith", instruction: "Find the word starting with U", voicePrompt: "Find the word starting with U", target: "U", choices: ["Umbrella", "Tomato", "Reporter", "Companion"], correctAnswer: "Umbrella", rewardMessage: "Incredible validation!" },
    { id: "alr_27", type: "startsWith", instruction: "Which word starts with T?", voicePrompt: "Which word starts with T?", target: "T", choices: ["Tomato", "Potato", "Umbrella", "Explosion"], correctAnswer: "Tomato", rewardMessage: "Juicy success!" },

    // --- TYPE 3: endsWith (13 Questions) ---
    { id: "alr_28", type: "endsWith", instruction: "Which word ends with T?", voicePrompt: "Which word ends with T?", target: "T", choices: ["Cat", "Dog", "Sun", "Bus"], correctAnswer: "Cat", rewardMessage: "Perfect terminal parsing!" },
    { id: "alr_29", type: "endsWith", instruction: "Find the word that ends with G", voicePrompt: "Find the word that ends with G", target: "G", choices: ["Frog", "Duck", "Fish", "Ship"], correctAnswer: "Frog", rewardMessage: "Leap forward!" },
    { id: "alr_30", type: "endsWith", instruction: "Which word ends with P?", voicePrompt: "Which word ends with P?", target: "P", choices: ["Lamp", "Milk", "Tent", "Wind"], correctAnswer: "Lamp", rewardMessage: "Spotless execution!" },
    { id: "alr_31", type: "endsWith", instruction: "Find the word that ends with K", voicePrompt: "Find the word that ends with K", target: "K", choices: ["Duck", "Nest", "Star", "Tree"], correctAnswer: "Duck", rewardMessage: "Quacking great job!" },
    { id: "alr_32", type: "endsWith", instruction: "Which word ends with N?", voicePrompt: "Which word ends with N?", target: "N", choices: ["Moon", "Boat", "Cake", "Kite"], correctAnswer: "Moon", rewardMessage: "Out of this world!" },
    { id: "alr_33", type: "endsWith", instruction: "Find the word ending with E", voicePrompt: "Find the word ending with E", target: "E", choices: ["Apple", "Robot", "Shark", "Clock"], correctAnswer: "Apple", rewardMessage: "Crisp and clear!" },
    { id: "alr_34", type: "endsWith", instruction: "Which word ends with H?", voicePrompt: "Which word ends with H?", target: "H", choices: ["Fish", "Tree", "Boat", "Cake"], correctAnswer: "Fish", rewardMessage: "Swimmingly perfect!" },
    { id: "alr_35", type: "endsWith", instruction: "Find the word that ends with R", voicePrompt: "Find the word that ends with R", target: "R", choices: ["Winter", "Garden", "Flower", "Basket"], correctAnswer: "Winter", rewardMessage: "Cool composure!" },
    { id: "alr_36", type: "endsWith", instruction: "Which word ends with W?", voicePrompt: "Which word ends with W?", target: "W", choices: ["Window", "Garden", "Rabbit", "Flower"], correctAnswer: "Window", rewardMessage: "Clear validation!" },
    { id: "alr_37", type: "endsWith", instruction: "Find the word ending with T", voicePrompt: "Find the word ending with T", target: "T", choices: ["Basket", "Window", "Butter", "Doctor"], correctAnswer: "Basket", rewardMessage: "Full basket of points!" },
    { id: "alr_38", type: "endsWith", instruction: "Which word ends with L?", voicePrompt: "Which word ends with L?", target: "L", choices: ["Pencil", "Doctor", "Candle", "Pocket"], correctAnswer: "Pencil", rewardMessage: "Masterful mark!" },
    { id: "alr_39", type: "endsWith", instruction: "Find the word ending with O", voicePrompt: "Find the word ending with O", target: "O", choices: ["Potato", "Reporter", "Umbrella", "Companion"], correctAnswer: "Potato", rewardMessage: "Mash hit!" },
    { id: "alr_40", type: "endsWith", instruction: "Last challenge! Find the word ending with N", voicePrompt: "Last challenge! Find the word ending with N", target: "N", choices: ["Companion", "Tomato", "Potato", "Umbrella"], correctAnswer: "Companion", rewardMessage: "Advanced Level Complete! You are an Orthographic Master!" }
  ],

  simpleWords: [
    { id: "asw_1",  word: "BEAUTIFUL",    scrambled: ["U", "B", "A", "E", "I", "F", "L", "T", "O"], meaningClue: "🌸 Gorgeous to observe!", audioPrompt: "Spell out: BEAUTIFUL." },
    { id: "asw_2",  word: "ELEPHANT",     scrambled: ["P", "E", "L", "H", "A", "N", "T", "E"],      meaningClue: "🐘 Enormous mammal with a long trunk!", audioPrompt: "Spell out: ELEPHANT." },
    { id: "asw_3",  word: "YESTERDAY",    scrambled: ["Y", "E", "S", "T", "E", "R", "D", "A"],      meaningClue: "📅 The complete calendar day right before today!", audioPrompt: "Assemble: YESTERDAY." },
    { id: "asw_4",  word: "REMEMBER",     scrambled: ["M", "E", "R", "E", "M", "B", "E", "R"],      meaningClue: "🧠 To pull memories back up into active thoughts!", audioPrompt: "Spell: REMEMBER." },
    { id: "asw_5",  word: "DINOSAUR",     scrambled: ["S", "D", "I", "N", "O", "A", "U", "R"],      meaningClue: "🦖 Extinct ancient reptile from long ago!", audioPrompt: "Assemble: DINOSAUR." },
    { id: "asw_6",  word: "HOSPITAL",     scrambled: ["P", "H", "O", "S", "I", "T", "A", "L"],      meaningClue: "🏥 Place for professional healthcare!", audioPrompt: "Spell: HOSPITAL." },
    { id: "asw_7",  word: "COMPUTER",     scrambled: ["M", "C", "O", "P", "U", "T", "E", "R"],      meaningClue: "💻 Processing machine running data software systems!", audioPrompt: "Build the word: COMPUTER." },
    { id: "asw_8",  word: "UMBRELLA",     scrambled: ["M", "U", "B", "R", "E", "L", "L", "A"],      meaningClue: "☔ Canvas protection covering against rain clouds!", audioPrompt: "Assemble: UMBRELLA." },
    { id: "asw_9",  word: "ASTRONAUT",    scrambled: ["S", "A", "T", "R", "O", "N", "A", "U", "T"], meaningClue: "🚀 Space explorer traveling on space rockets!", audioPrompt: "Spell: ASTRONAUT." },
    { id: "asw_10", word: "MICROSCOPE",   scrambled: ["C", "M", "I", "R", "O", "S", "C", "P", "E"], meaningClue: "🔬 Lens tool that magnifying micro-structures!", audioPrompt: "Spell out: MICROSCOPE." },
    { id: "asw_11", word: "TELESCOPE",    scrambled: ["E", "T", "L", "E", "S", "C", "O", "P"],      meaningClue: "🔭 Tool to observe starry galaxies!", audioPrompt: "Assemble: TELESCOPE." },
    { id: "asw_12", word: "HELICOPTER",   scrambled: ["L", "H", "E", "I", "C", "O", "P", "T", "R"], meaningClue: "🚁 Aerial transport with spinning rotors up top!", audioPrompt: "Spell: HELICOPTER." },
    { id: "asw_13", word: "SUBMARINE",    scrambled: ["B", "S", "U", "M", "A", "R", "I", "N", "E"], meaningClue: "⚓ Undersea boat cruising under blue oceans!", audioPrompt: "Assemble: SUBMARINE." },
    { id: "asw_14", word: "MOTORCYCLE",   scrambled: ["T", "M", "O", "O", "R", "C", "Y", "C", "L"], meaningClue: "🏍️ Two-wheeled fast road transport vehicle!", audioPrompt: "Spell out: MOTORCYCLE." },
    { id: "asw_15", word: "CALCULATOR",   scrambled: ["L", "C", "A", "C", "U", "A", "T", "O", "R"], meaningClue: "🧮 Math helper machine processing equations!", audioPrompt: "Build the word: CALCULATOR." },
    { id: "asw_16", word: "DICTIONARY",   scrambled: ["C", "D", "I", "T", "I", "O", "N", "A", "R"], meaningClue: "📚 Thick book containing terminology meanings!", audioPrompt: "Spell: DICTIONARY." },
    { id: "asw_17", word: "CATERPILLAR",  scrambled: ["T", "C", "A", "E", "R", "P", "I", "L", "R"], meaningClue: "🐛 Creeping insect transitioning into butterflies!", audioPrompt: "Assemble: CATERPILLAR." },
    { id: "asw_18", word: "BUTTERFLY",    scrambled: ["T", "B", "U", "T", "E", "R", "F", "L", "Y"], meaningClue: "🦋 Delicate winged insect seeking floral nectar!", audioPrompt: "Spell out: BUTTERFLY." },
    { id: "asw_19", word: "DRAGONFLY",    scrambled: ["G", "D", "R", "A", "O", "N", "F", "L", "Y"], meaningClue: "🛸 Quick four-winged flyer zooming across ponds!", audioPrompt: "Spell out: DRAGONFLY." },
    { id: "asw_20", word: "GRASSHOPPER",  scrambled: ["S", "G", "R", "A", "S", "H", "O", "P", "R"], meaningClue: "🦗 Jumping green lawn insect making loud chirps!", audioPrompt: "Assemble: GRASSHOPPER." },
    { id: "asw_21", word: "WATERMELON",   scrambled: ["T", "W", "A", "E", "R", "M", "E", "L", "O"], meaningClue: "🍉 Giant juicy fruit packed with pink water pulp!", audioPrompt: "Spell out: WATERMELON." },
    { id: "asw_22", word: "STRAWBERRY",   scrambled: ["T", "S", "R", "A", "W", "B", "E", "R", "Y"], meaningClue: "🍓 Sweet red summer treat with outer seeds!", audioPrompt: "Build the word: STRAWBERRY." },
    { id: "asw_23", word: "PINEAPPLE",    scrambled: ["N", "P", "I", "E", "A", "P", "P", "L", "E"], meaningClue: "🍍 Golden spiky tropical plantation treat!", audioPrompt: "Assemble: PINEAPPLE." },
    { id: "asw_24", word: "AVOCADO",      scrambled: ["V", "A", "O", "C", "A", "D", "O"],           meaningClue: "🥑 Green pear-shaped item with a solid inner seed!", audioPrompt: "Spell: AVOCADO." },
    { id: "asw_25", word: "SPAGHETTI",    scrambled: ["P", "S", "A", "G", "H", "E", "T", "I"],      meaningClue: "🍝 Long twisted strands of hot boiling noodles!", audioPrompt: "Assemble: SPAGHETTI." },
    { id: "asw_26", word: "HAMBURGER",    scrambled: ["M", "H", "A", "B", "U", "R", "G", "E", "R"], meaningClue: "🍔 Toasted buns containing hot meat patties!", audioPrompt: "Spell: HAMBURGER." },
    { id: "asw_27", word: "SANDWICH",     scrambled: ["N", "S", "A", "D", "W", "I", "C", "H"],      meaningClue: "🥪 Food slices stacked inside fresh bread slices!", audioPrompt: "Build the word: SANDWICH." },
    { id: "asw_28", word: "CHOCOLATE",    scrambled: ["O", "C", "H", "C", "O", "L", "A", "T", "E"], meaningClue: "🍫 Sweet dark brown confectionery bars!", audioPrompt: "Assemble: CHOCOLATE." },
    { id: "asw_29", word: "MARSHMALLOW",  scrambled: ["R", "M", "A", "S", "H", "M", "A", "L", "O"], meaningClue: "🍡 Puffy white sugar structures toasted on camps!", audioPrompt: "Spell: MARSHMALLOW." },
    { id: "asw_30", word: "DANGEROUS",    scrambled: ["N", "D", "A", "G", "E", "R", "O", "U", "S"], meaningClue: "⚠️ Full of severe safety risks and hazards!", audioPrompt: "Assemble: DANGEROUS." },
    { id: "asw_31", word: "POWERFUL",     scrambled: ["W", "P", "O", "E", "R", "F", "U", "L"],      meaningClue: "⚡ Exploding with great mechanical strength!", audioPrompt: "Spell: POWERFUL." },
    { id: "asw_32", word: "WONDERFUL",    scrambled: ["O", "W", "N", "D", "E", "R", "F", "U", "L"], meaningClue: "⭐ Outstandingly beautiful and refreshing!", audioPrompt: "Assemble: WONDERFUL." },
    { id: "asw_33", word: "CAREFULLY",    scrambled: ["R", "C", "A", "E", "F", "U", "L", "L", "Y"], meaningClue: "🛡️ Doing tasks with focused safety caution!", audioPrompt: "Spell: CAREFULLY." },
    { id: "asw_34", word: "EXCITEDLY",    scrambled: ["X", "E", "C", "I", "T", "E", "D", "L", "Y"], meaningClue: "🎉 Behaving with full energetic enthusiasm!", audioPrompt: "Build the word: EXCITEDLY." },
    { id: "asw_35", word: "COMMUNITY",    scrambled: ["O", "C", "M", "M", "U", "N", "I", "T", "Y"], meaningClue: "🏘️ Neighborhood of citizens living linked together!", audioPrompt: "Spell: COMMUNITY." },
    { id: "asw_36", word: "EDUCATION",    scrambled: ["D", "E", "U", "C", "A", "T", "I", "O", "N"], meaningClue: "📚 Active process of learning academic knowledge!", audioPrompt: "Assemble: EDUCATION." },
    { id: "asw_37", word: "CELEBRATION",  scrambled: ["E", "C", "L", "E", "B", "R", "A", "T", "O"], meaningClue: "🥳 Festive gathering to mark grand events!", audioPrompt: "Spell: CELEBRATION." },
    { id: "asw_38", word: "ENVIRONMENT",  scrambled: ["N", "E", "V", "I", "R", "O", "M", "E", "N"], meaningClue: "🌲 Total ecosystem around land and air wildlife!", audioPrompt: "Build: ENVIRONMENT." },
    { id: "asw_39", word: "IMPROVEMENT",  scrambled: ["M", "I", "P", "R", "O", "V", "E", "M", "N"], meaningClue: "📈 Modifying features to enhance total quality!", audioPrompt: "Spell: IMPROVEMENT." },
    { id: "asw_40", word: "MANAGEMENT",   scrambled: ["A", "M", "N", "A", "G", "E", "M", "E", "N"], meaningClue: "👔 Team controlling organizational operations!", audioPrompt: "Last one! Spell out: MANAGEMENT." }
  ],

  syllableBasics: Array.from({ length: 40 }, (_, idx) => {
  const list = [
    {
      w: "GIGANTIC",
      c: 3,
      b: "GI - GAN - TIC",
      k: "🦖 Incredibly huge structural scale!",
      a: "Listen carefully: GI-GAN-TIC. Clap the three syllables!"
    },
    {
      w: "FANTASTIC",
      c: 3,
      b: "FAN - TAS - TIC",
      k: "🌟 Completely excellent or superb!",
      a: "How many beats can you hear in FAN-TAS-TIC?"
    },
    {
      w: "TOMORROW",
      c: 3,
      b: "TO - MOR - ROW",
      k: "📅 The upcoming day following today!",
      a: "Tap the syllables in TO-MOR-ROW."
    },
    {
      w: "ALPHABET",
      c: 3,
      b: "AL - PHA - BET",
      k: "🔤 Arranged set of letters!",
      a: "Clap along: AL-PHA-BET."
    },
    {
      w: "CHOCOLATE",
      c: 3,
      b: "CHOC - O - LATE",
      k: "🍫 A sweet treat made from cocoa!",
      a: "Count the syllables in CHOC-O-LATE."
    },
    {
      w: "UMBRELLA",
      c: 3,
      b: "UM - BREL - LA",
      k: "☂️ Used to protect you from rain!",
      a: "How many parts are in UM-BREL-LA?"
    },
    {
      w: "PINEAPPLE",
      c: 3,
      b: "PINE - AP - PLE",
      k: "🍍 A juicy tropical fruit!",
      a: "Clap each part of PINE-AP-PLE."
    },
    {
      w: "DINOSAUR",
      c: 3,
      b: "DI - NO - SAUR",
      k: "🦕 A giant prehistoric reptile!",
      a: "Listen: DI-NO-SAUR. Count the beats."
    },
    {
      w: "BUTTERFLY",
      c: 3,
      b: "BUT - TER - FLY",
      k: "🦋 A colorful insect with wings!",
      a: "Tap out the syllables in BUT-TER-FLY."
    },
    {
      w: "WATERMELON",
      c: 4,
      b: "WA - TER - MEL - ON",
      k: "🍉 A large juicy summer fruit!",
      a: "Can you clap all four parts of WA-TER-MEL-ON?"
    },
    {
      w: "HELICOPTER",
      c: 4,
      b: "HEL - I - COP - TER",
      k: "🚁 An aircraft with spinning blades!",
      a: "Count the syllables in HEL-I-COP-TER."
    },
    {
      w: "CALENDAR",
      c: 4,
      b: "CAL - EN - DAR",
      k: "📆 Used to keep track of days and months!",
      a: "Listen carefully: CAL-EN-DAR."
    },
    {
      w: "VEGETABLE",
      c: 4,
      b: "VEG - E - TA - BLE",
      k: "🥕 Healthy food grown in gardens and farms!",
      a: "How many syllables are in VEG-E-TA-BLE?"
    },
    {
      w: "CELEBRATION",
      c: 4,
      b: "CEL - E - BRA - TION",
      k: "🎉 A special event to mark a happy occasion!",
      a: "Clap the syllables in CEL-E-BRA-TION."
    }
  ];

  const item = list[idx % list.length];

  return {
    id: `asyl_${idx + 1}`,
    word: item.w,
    syllablesCount: item.c,
    breakdown: item.b,
    meaningClue: item.k,
    audioPrompt: item.a
  };
}) as SyllableChallenge[] };