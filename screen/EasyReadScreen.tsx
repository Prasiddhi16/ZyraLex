// screens/EasyReadScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as Speech from 'expo-speech';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { EasyReadSettingsModal, THEMES } from '../components/EasyReadSettingsModal';
import { EasyReadToolbar } from '../components/EasyReadToolbar';
import { ParsedPage, parsePdfDocument, splitIntoSyllables } from '../services/pdfParserService';

// STUB REUSE EXAMPLES: Import mock hooks representing your pre-existing systems
const useGazeDetectionMock = () => ({ isUserLookingAway: false });

export const EasyReadScreen = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<ParsedPage[]>([]);
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState<number | null>(null);

  // Custom Typography & Layout State
  const [fontSize, setFontSize] = useState(20);
  const [lineSpacing, setLineSpacing] = useState(2);
  const [letterSpacing, setLetterSpacing] = useState(2);
  const [themeKey, setThemeKey] = useState<keyof typeof THEMES>('cream');
  const [fontFamily, setFontFamily] = useState('System');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Split Words toggle — implemented locally so it doesn't depend on
  // internals of EasyReadToolbar / EasyReadSettingsModal.
  const [splitWordsOn, setSplitWordsOn] = useState(false);

  // Speech Rate State (0.5x, 1.0x, 1.5x, 2.0x)
  const [speechRate, setSpeechRate] = useState<number>(1.0);

  const theme = THEMES[themeKey];
  const fileIdRef = useRef<string>("");

  // Existing module integration hooks tracking
  const { isUserLookingAway } = useGazeDetectionMock();

  // Watch gaze changes: Automatically handle pauses when user shifts gaze
  useEffect(() => {
    if (isUserLookingAway && isPlaying) {
      handlePause();
    }
  }, [isUserLookingAway]);

  // Load persistence positions when file identifier modifications occur
  useEffect(() => {
    if (pages.length > 0) {
      loadReadingProgress();
    }
  }, [pages]);

  const selectDocument = async () => {
    setError(null);

    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/json'],
      copyToCacheDirectory: true,
    });
    if (res.canceled || !res.assets?.length) return;

    const asset = res.assets[0];
    const fileName = asset.name ?? 'document';
    fileIdRef.current = fileName;
    setSplitWordsOn(false);
    setLoading(true);

    const isJson =
      (asset as any).mimeType === 'application/json' ||
      fileName.toLowerCase().endsWith('.json');

    try {
      let parsedData: ParsedPage[];

      if (Platform.OS === 'web') {
        const file = (asset as any).file as Blob | undefined;
        if (!file) {
          throw new Error("Could not read the selected file as a Blob (web only).");
        }

        if (isJson) {
          const raw = await file.text();
          let data: unknown;
          try {
            data = JSON.parse(raw);
          } catch {
            throw new Error("That file isn't valid JSON — check for a trailing comma or missing bracket.");
          }
          if (!Array.isArray(data)) {
            throw new Error("Expected a JSON array of pages, e.g. [{ text, sentences, syllableMap }, ...]");
          }
          const looksValid = data.every(
            (p) =>
              p &&
              typeof p === 'object' &&
              typeof (p as any).text === 'string' &&
              Array.isArray((p as any).sentences),
          );
          if (!looksValid) {
            throw new Error("Each page needs at least { text: string, sentences: string[] }. syllableMap is optional.");
          }
          parsedData = (data as any[]).map((p, i) => ({
            pageNumber: p.pageNumber ?? i + 1,
            text: p.text,
            sentences: p.sentences,
            syllableMap: Array.isArray(p.syllableMap) ? p.syllableMap : [],
          }));
        } else {
          parsedData = await parsePdfDocument(file);
        }
      } else {
        parsedData = await parsePdfDocument(asset.uri);
      }

      if (
        parsedData.length === 1 &&
        parsedData[0].text.startsWith("Parsing error occurred:")
      ) {
        setError(parsedData[0].text);
        setPages([]);
        return;
      }

      setPages(parsedData);
      setCurrentPageIdx(0);
      setCurrentSentenceIdx(null);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const saveReadingProgress = async (pageIdx: number) => {
    if (!fileIdRef.current) return;
    await AsyncStorage.setItem(`@easy_read_progress_${fileIdRef.current}`, String(pageIdx));
  };

  const loadReadingProgress = async () => {
    const saved = await AsyncStorage.getItem(`@easy_read_progress_${fileIdRef.current}`);
    if (saved !== null) {
      setCurrentPageIdx(Number(saved));
    }
  };

  // Splits EVERY word in `sentence` into syllables live, e.g.
  // "environment" -> "en·vi·ron·ment". This works on any text — JSON,
  // PDF, whatever — not just words that happen to be pre-mapped.
  const applySyllableSplits = (sentence: string) => {
    if (!splitWordsOn) return sentence;
    return sentence.replace(/[A-Za-z]+/g, (word) => splitIntoSyllables(word));
  };

  const speakCurrentSentence = (index: number) => {
    const activePage = pages[currentPageIdx];
    if (!activePage || index >= activePage.sentences.length) {
      handleNextPage();
      return;
    }

    setCurrentSentenceIdx(index);
    setIsPlaying(true);

    Speech.speak(activePage.sentences[index], {
      rate: speechRate,
      onDone: () => speakCurrentSentence(index + 1),
      onStopped: () => setIsPlaying(false),
      onError: () => setIsPlaying(false)
    });
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      handlePause();
    } else {
      speakCurrentSentence(currentSentenceIdx ?? 0);
    }
  };

  const handlePause = () => {
    Speech.stop();
    setIsPlaying(false);
  };

  const handleStop = () => {
    Speech.stop();
    setIsPlaying(false);
    setCurrentSentenceIdx(null);
  };

  const handleNextPage = () => {
    if (currentPageIdx < pages.length - 1) {
      handleStop();
      const nextIdx = currentPageIdx + 1;
      setCurrentPageIdx(nextIdx);
      saveReadingProgress(nextIdx);
    }
  };

  const handlePrevPage = () => {
    if (currentPageIdx > 0) {
      handleStop();
      const prevIdx = currentPageIdx - 1;
      setCurrentPageIdx(prevIdx);
      saveReadingProgress(prevIdx);
    }
  };

  const progressPercentage = pages.length > 0 ? Math.round(((currentPageIdx + 1) / pages.length) * 100) : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Easy Read Engine</Text>
        {pages.length > 0 && (
          <Text style={[styles.progressIndicator, { color: theme.text }]}>
            Page {currentPageIdx + 1} of {pages.length} ({progressPercentage}%)
          </Text>
        )}
      </View>

      <View style={styles.contentArea}>
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : pages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <TouchableOpacity style={styles.uploadBtn} onPress={selectDocument}>
              <Text style={styles.uploadBtnText}>📂 Open PDF or JSON File</Text>
            </TouchableOpacity>
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.textContainer}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {pages[currentPageIdx]?.sentences.map((sentence, idx) => {
                const isCurrent = idx === currentSentenceIdx;
                const displayText = applySyllableSplits(sentence);
                return (
                  <Text
                    key={idx}
                    style={{
                      fontSize: fontSize,
                      lineHeight: fontSize * lineSpacing,
                      letterSpacing: letterSpacing,
                      fontFamily: fontFamily === 'System' ? undefined : fontFamily,
                      color: theme.text,
                      backgroundColor: isCurrent ? '#FFFF00' : 'transparent',
                      fontWeight: isCurrent ? 'bold' : 'normal',
                      marginBottom: 8,
                    }}
                  >
                    {displayText}{' '}
                  </Text>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>

      {pages.length > 0 && (
        <View style={styles.splitWordsRow}>
          <Pressable
            style={[styles.splitWordsPill, splitWordsOn && styles.splitWordsPillActive]}
            onPress={() => setSplitWordsOn((v) => !v)}
          >
            <Ionicons name="ellipse" size={10} color="#7C3AED" />
            <Text style={styles.splitWordsText}>
              {splitWordsOn ? 'Split Words: On' : 'Split Words'}
            </Text>
          </Pressable>
        </View>
      )}

      {pages.length > 0 && (
        <EasyReadToolbar
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onStop={handleStop}
          onPrevPage={handlePrevPage}
          onNextPage={handleNextPage}
          onOpenSettings={() => setSettingsOpen(true)}
          canPrev={currentPageIdx > 0}
          canNext={currentPageIdx < pages.length - 1}
        />
      )}

      <EasyReadSettingsModal
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        fontSize={fontSize}
        setFontSize={setFontSize}
        lineSpacing={lineSpacing}
        setLineSpacing={setLineSpacing}
        letterSpacing={letterSpacing}
        setLetterSpacing={setLetterSpacing}
        currentTheme={themeKey}
        setTheme={setThemeKey}
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
        speechRate={speechRate}
        setSpeechRate={setSpeechRate}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  progressIndicator: { fontSize: 14, fontWeight: '600' },
  contentArea: { flex: 1, justifyContent: 'center', paddingHorizontal: 15 },
  emptyContainer: { alignItems: 'center' },
  uploadBtn: { backgroundColor: '#007AFF', paddingHorizontal: 25, paddingVertical: 15, borderRadius: 12 },
  uploadBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  errorText: { color: '#DC2626', marginTop: 12, fontSize: 13, textAlign: 'center', maxWidth: 300 },
  textContainer: { paddingVertical: 20 },
  splitWordsRow: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  splitWordsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
  },
  splitWordsPillActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#C4B5FD',
  },
  splitWordsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7C3AED',
  },
});