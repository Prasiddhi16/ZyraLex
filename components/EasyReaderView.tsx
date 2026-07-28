import React, { useRef, useState } from 'react';
import { ParsedPage, parsePdfDocument } from '../services/pdfParserService';

const LINE_SPACING_OPTIONS = [
  { label: 'Compact', value: 1.2 },
  { label: 'Standard', value: 1.5 },
  { label: 'Relaxed', value: 1.8 },
];

const LETTER_SPACING_OPTIONS = [
  { label: 'Tight', value: '0px' },
  { label: 'Normal', value: '0.5px' },
  { label: 'Wide', value: '1.5px' },
];

const SPEECH_SPEED_OPTIONS = [0.5, 1.0, 1.5, 2.0];

export default function EasyReaderView() {
  const [pages, setPages] = useState<ParsedPage[]>([]);
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState<number | null>(null);
  const [isSyllableMode, setIsSyllableMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Visual Adjustments state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(20);
  const [lineSpacing, setLineSpacing] = useState(1.5);
  const [letterSpacing, setLetterSpacing] = useState('0.5px');
  const [fontFamily, setFontFamily] = useState<'Times New Roman' | 'System'>('Times New Roman');
  const [speechRate, setSpeechRate] = useState(1.0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageData = pages[currentPageIdx] ?? null;

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    setError(null);
    setLoading(true);
    setIsSyllableMode(false);
    stopReading();

    const isJson =
      file.type === 'application/json' || file.name.toLowerCase().endsWith('.json');

    try {
      let parsedPages: ParsedPage[];

      if (isJson) {
        const raw = await file.text();
        let data: unknown;
        try {
          data = JSON.parse(raw);
        } catch {
          throw new Error("That file isn't valid JSON — check for a trailing comma or missing bracket.");
        }
        if (!Array.isArray(data)) {
          throw new Error('Expected a JSON array of pages, e.g. [{ text, sentences, syllableMap }, ...]');
        }
        const looksValid = data.every(
          (p) =>
            p &&
            typeof p === 'object' &&
            typeof (p as any).text === 'string' &&
            Array.isArray((p as any).sentences),
        );
        if (!looksValid) {
          throw new Error('Each page needs at least { text: string, sentences: string[] }. syllableMap is optional.');
        }
        parsedPages = (data as any[]).map((p, i) => ({
          pageNumber: p.pageNumber ?? i + 1,
          text: p.text,
          sentences: p.sentences,
          syllableMap: Array.isArray(p.syllableMap) ? p.syllableMap : [],
        }));
      } else {
        parsedPages = await parsePdfDocument(file);
        if (
          parsedPages.length === 1 &&
          parsedPages[0].text.startsWith('Parsing error occurred:')
        ) {
          throw new Error(parsedPages[0].text);
        }
      }

      setPages(parsedPages);
      setCurrentPageIdx(0);
      setCurrentSentenceIdx(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
      setPages([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Scans text tokens and injects spaced syllables dynamically when active
   */
  const processSentenceText = (sentence: string) => {
    if (!pageData || !isSyllableMode) return sentence;

    let modifiedText = sentence;
    const sortedMap = [...pageData.syllableMap].sort(
      (a, b) => b.original.length - a.original.length,
    );

    sortedMap.forEach(({ original, split }) => {
      const regex = new RegExp(`\\b${original}\\b`, 'gi');
      modifiedText = modifiedText.replace(regex, split);
    });

    return modifiedText;
  };

  // --- Read Aloud, using the browser's built-in Web Speech API ---
  // (expo-speech only works inside an Expo app; this file is plain web React.)
  const stopReading = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  const speakSentence = (index: number) => {
    if (!pageData) return;
    if (index >= pageData.sentences.length) {
      handleNextPage();
      return;
    }

    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setError('Speech synthesis is not supported in this browser.');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(pageData.sentences[index]);
    utterance.rate = speechRate;
    utterance.onend = () => speakSentence(index + 1);
    utterance.onerror = () => setIsPlaying(false);

    setCurrentSentenceIdx(index);
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleReadAloud = () => {
    if (isPlaying) {
      stopReading();
    } else {
      speakSentence(currentSentenceIdx ?? 0);
    }
  };

  const handleNextPage = () => {
    if (currentPageIdx < pages.length - 1) {
      stopReading();
      setCurrentSentenceIdx(null);
      setCurrentPageIdx((i) => i + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPageIdx > 0) {
      stopReading();
      setCurrentSentenceIdx(null);
      setCurrentPageIdx((i) => i - 1);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white shadow-xl border-x font-sans">
      {/* Hidden native file input driving the picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,application/json,.pdf,.json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* HEADER BAR */}
      <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
        <button
          onClick={handlePrevPage}
          disabled={currentPageIdx === 0}
          className="p-2 hover:bg-gray-200 rounded-full text-gray-700 transition disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-black text-gray-900 tracking-wide">Zyralex</h1>
          <p className="text-xs text-gray-500 tracking-wider -mt-1">Simplified learning.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-gray-200 text-gray-700 font-bold px-2.5 py-1 rounded-md">
            Page {pages.length > 0 ? currentPageIdx + 1 : 0} of {pages.length}
          </span>
        </div>
      </div>

      {/* READING CANVAS VIEW */}
      <div className="flex-1 p-8 overflow-y-auto bg-white select-text">
        {loading ? (
          <div className="flex h-full items-center justify-center text-gray-500">Extracting text…</div>
        ) : !pageData ? (
          <div className="flex flex-col h-full items-center justify-center gap-4">
            <button
              onClick={openFilePicker}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition"
            >
              📂 Open PDF or JSON File
            </button>
            {error && <p className="text-red-600 text-sm max-w-sm text-center">{error}</p>}
          </div>
        ) : (
          <div
            className="whitespace-pre-line transition-all duration-300"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: lineSpacing,
              letterSpacing,
              fontFamily: fontFamily === 'Times New Roman' ? 'Times New Roman, serif' : undefined,
              color: '#1f2937',
            }}
          >
            {pageData.sentences.map((sentence, idx) => (
              <span
                key={idx}
                style={{
                  backgroundColor: idx === currentSentenceIdx ? '#FDE68A' : 'transparent',
                  fontWeight: idx === currentSentenceIdx ? 700 : 400,
                }}
              >
                {processSentenceText(sentence)}{' '}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* PRIMARY CONTROLS ACTION PANEL */}
      {pageData && (
        <div className="p-6 bg-gray-50 border-t space-y-4">
          <div className="flex gap-4 items-center justify-between">
            <button
              onClick={() => setIsSyllableMode(!isSyllableMode)}
              className={`px-6 py-4 rounded-xl font-bold tracking-wide text-base border-2 transition-all duration-200 flex items-center gap-2 ${
                isSyllableMode
                  ? 'bg-purple-600 text-white border-purple-700 shadow-md'
                  : 'bg-white text-purple-700 border-purple-300 hover:bg-purple-50 shadow-sm'
              }`}
            >
              <span className="text-lg">{isSyllableMode ? '🟢' : '⚪'}</span>
              <span>Syllable Splitter</span>
            </button>

            <button
              onClick={handleReadAloud}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-4 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md transition text-base tracking-wide"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                {isPlaying ? (
                  <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                ) : (
                  <path d="M8 5v14l11-7z" />
                )}
              </svg>
              <span>{isPlaying ? 'Pause' : 'Read Aloud'}</span>
            </button>

            <button
              onClick={handleNextPage}
              disabled={currentPageIdx >= pages.length - 1}
              className="p-2 hover:bg-gray-200 rounded-full text-gray-700 transition disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>

          <button
            onClick={() => setSettingsOpen(true)}
            className="w-full text-center text-sm font-semibold text-gray-500 hover:text-gray-800 transition py-1"
          >
            ⚙️ Adjust Accessibility Settings
          </button>
        </div>
      )}

      {/* VISUAL ADJUSTMENTS MODAL — plain web React/Tailwind, matching
          the design language of EasyReadSettingsModal.tsx but implemented
          natively for the DOM since this screen isn't React Native. */}
      {settingsOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-center text-gray-900 mb-5">Visual Adjustments</h2>

            <p className="text-sm font-semibold text-gray-600 mt-3 mb-2">Text Size ({fontSize}px)</p>
            <div className="flex gap-2">
              <button
                onClick={() => setFontSize((s) => Math.max(11, s - 1))}
                className="flex-1 bg-gray-100 hover:bg-gray-200 rounded-lg py-3 font-bold text-gray-700"
              >
                A-
              </button>
              <button
                onClick={() => setFontSize((s) => Math.min(32, s + 1))}
                className="flex-1 bg-gray-100 hover:bg-gray-200 rounded-lg py-3 font-bold text-gray-700"
              >
                A+
              </button>
            </div>

            <p className="text-sm font-semibold text-gray-600 mt-4 mb-2">Typography Style</p>
            <div className="flex gap-2">
              {(['Times New Roman', 'System'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFontFamily(f)}
                  className={`flex-1 rounded-lg py-3 font-semibold text-sm ${
                    fontFamily === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                  style={f === 'Times New Roman' ? { fontFamily: 'Times New Roman, serif' } : undefined}
                >
                  {f === 'Times New Roman' ? 'Times New Roman' : 'Modern Sans'}
                </button>
              ))}
            </div>

            <p className="text-sm font-semibold text-gray-600 mt-4 mb-2">Line Spacing</p>
            <div className="flex gap-2">
              {LINE_SPACING_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setLineSpacing(opt.value)}
                  className={`flex-1 rounded-lg py-3 font-semibold text-sm ${
                    lineSpacing === opt.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <p className="text-sm font-semibold text-gray-600 mt-4 mb-2">Letter Spacing</p>
            <div className="flex gap-2">
              {LETTER_SPACING_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setLetterSpacing(opt.value)}
                  className={`flex-1 rounded-lg py-3 font-semibold text-sm ${
                    letterSpacing === opt.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <p className="text-sm font-semibold text-gray-600 mt-4 mb-2">Speech Speed</p>
            <div className="flex gap-2">
              {SPEECH_SPEED_OPTIONS.map((rate) => (
                <button
                  key={rate}
                  onClick={() => setSpeechRate(rate)}
                  className={`flex-1 rounded-lg py-3 font-semibold text-sm ${
                    speechRate === rate ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            <button
              onClick={() => setSettingsOpen(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl py-4 mt-6"
            >
              Apply Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}