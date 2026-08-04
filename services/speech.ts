import * as Speech from "expo-speech";

// Trackers to catch rogue React re-renders and rapid-fire execution
let currentSpeechSessionId = 0;
let lastSpokenText = "";
let lastSpokenTimestamp = 0;

/**
 * Centrally manages text-to-speech requests. 
 * Automatically interrupts any ongoing speech to prevent overlapping or queuing.
 * Implements strict deduplication to stop rapid repetitions from component re-renders.
 */
export const speakWord = async (word: string) => {
  try {
    if (!word || word.trim() === "") return;
    
    const cleanWord = word.trim();
    const now = Date.now();

    // 1. ANTI-REPETITION LOCK:
    // If the exact same word is triggered within 400ms, ignore the second call completely.
    // This stops React re-render loops and double-clicks dead in their tracks.
    if (cleanWord === lastSpokenText && (now - lastSpokenTimestamp) < 400) {
      return; 
    }

    // Update global tracking states immediately
    lastSpokenText = cleanWord;
    lastSpokenTimestamp = now;
    const currentId = ++currentSpeechSessionId;

    // 2. CRITICAL SYNC FIX: Force stop any current audio instantly
    await Speech.stop();

    // 3. NATIVE BRIDGE BUFFER DEBOUNCE:
    // Give the native OS thread a clean window to reset and drop its audio channels
    await new Promise((resolve) => setTimeout(resolve, 60));

    // 4. Stale Request Check: If a newer request took over during our 60ms pause, cancel this one.
    if (currentId !== currentSpeechSessionId) return;

    // 5. Play the clean instruction
    Speech.speak(cleanWord, {
      language: "en-US",
      pitch: 1.1,
      rate: 0.8, // Your optimal reading pace for dyslexia learning
    });
  } catch (error) {
    console.error("Global Speech Sync Error:", error);
  }
};

/**
 * Call this globally whenever a user exits a learning module or game screen.
 * It ensures audio does not continue playing in the background of the app.
 */
export const stopSpeech = async () => {
  try {
    // Wipe history locks so the next feature screen can play sound immediately
    currentSpeechSessionId++;
    lastSpokenText = "";
    lastSpokenTimestamp = 0;
    
    await Speech.stop();
  } catch (error) {
    console.error("Error stopping global speech:", error);
  }
};