// services/voice.ts

export type EvaluationResult =
  | "well_done"
  | "rushed"
  | "keep_trying"
  | "no_speech";

export interface SpeechConfig {
  targetText: string;
  onTranscriptUpdate: (text: string) => void;
  onComplete: (result: EvaluationResult) => void;
}

export interface StopListeningResult {
  result: EvaluationResult;
  transcript: string;
  correctWords: string[];
  accuracy: number; // 0–100
}

// Keep track of the active instance and transcript
let recognitionInstance: any = null;
let accumulatedTranscript = "";

export const startListening = (config: SpeechConfig) => {
  if (typeof window === "undefined") return;

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.error("Speech recognition not supported in this browser.");
    return;
  }

  // Clean up any existing instance
  if (recognitionInstance) {
    try {
      recognitionInstance.abort();
    } catch (e) {}
  }

  recognitionInstance = new SpeechRecognition();
  recognitionInstance.continuous = true;
  recognitionInstance.interimResults = true;
  recognitionInstance.lang = "en-US";

  accumulatedTranscript = "";

  recognitionInstance.onresult = (event: any) => {
    let interimTranscript = "";
    let finalTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript + " ";
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    accumulatedTranscript += finalTranscript;

    const totalCurrentSpeech = (accumulatedTranscript + interimTranscript).trim();
    config.onTranscriptUpdate(totalCurrentSpeech);
  };

  recognitionInstance.onerror = (event: any) => {
    console.error("[Speech Error]", event.error);
  };

  recognitionInstance.start();
};

const cleanString = (str: string) =>
  str
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .trim();

export const stopListening = (targetText: string): StopListeningResult => {
  if (recognitionInstance) {
    try {
      recognitionInstance.stop();
    } catch (e) {
      console.log("Error stopping recognition", e);
    }
  }

  const targetWords = cleanString(targetText).split(/\s+/).filter(Boolean);
  const spokenWords = cleanString(accumulatedTranscript).split(/\s+/).filter(Boolean);

  const correctWords = targetWords.filter((w) => spokenWords.includes(w));
  const accuracy = targetWords.length
    ? Math.round((correctWords.length / targetWords.length) * 100)
    : 0;

  let result: EvaluationResult;

  if (spokenWords.length === 0) {
    // Case 1: No speech detected
    result = "no_speech";
  } else if (
    spokenWords.length === targetWords.length &&
    targetWords.every((word, i) => spokenWords[i] === word)
  ) {
    // Case 2: Perfect strict sequence match
    result = "well_done";
  } else if (correctWords.length > 0) {
    // Case 3: Some words matched but sequence/coverage broken
    result = "keep_trying";
  } else {
    // Case 4: No words matched at all
    result = "rushed";
  }

  const transcript = accumulatedTranscript.trim();

  return { result, transcript, correctWords, accuracy };
};