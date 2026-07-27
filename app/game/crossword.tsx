import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, usePathname } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import emojis from "../../assets/emojis.json"; // Grid words data

// Type definitions
type WordEntry = { name: string; emoji: string };
type Direction = "across" | "down";
type Placement = {
  word: string;
  emoji: string;
  row: number;
  col: number;
  direction: Direction;
};
type Cell = {
  letter: string | null;
  number: number | null;
  acrossStart: boolean;
  downStart: boolean;
};
type Clue = { number: number; word: string; emoji: string };
type CellCoord = { r: number; c: number };

// Shuffle grid pool
function fisherYatesShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Clean raw names
function cleanWord(name: string) {
  return name.replace(/[^a-zA-Z]/g, "").toUpperCase();
}

const GRID_SIZE = 15;
const MIN_WORD_LEN = 3;
const MAX_WORD_LEN = 8;

// Map intersection points
function generateCrossword(pool: WordEntry[], targetCount: number) {
  const grid: (string | null)[][] = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill(null)
  );
  const placements: Placement[] = [];

  const inBounds = (r: number, c: number) =>
    r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE;

  const canPlace = (word: string, row: number, col: number, dir: Direction) => {
    for (let i = 0; i < word.length; i++) {
      const r = dir === "down" ? row + i : row;
      const c = dir === "across" ? col + i : col;
      if (!inBounds(r, c)) return false;
      const existing = grid[r][c];
      if (existing && existing !== word[i]) return false;
    }

    const beforeR = dir === "down" ? row - 1 : row;
    const beforeC = dir === "across" ? col - 1 : col;
    const afterR = dir === "down" ? row + word.length : row;
    const afterC = dir === "across" ? col + word.length : col;
    if (inBounds(beforeR, beforeC) && grid[beforeR][beforeC]) return false;
    if (inBounds(afterR, afterC) && grid[afterR][afterC]) return false;

    for (let i = 0; i < word.length; i++) {
      const r = dir === "down" ? row + i : row;
      const c = dir === "across" ? col + i : col;
      if (grid[r][c]) continue;

      if (dir === "across") {
        if (inBounds(r - 1, c) && grid[r - 1][c]) return false;
        if (inBounds(r + 1, c) && grid[r + 1][c]) return false;
      } else {
        if (inBounds(r, c - 1) && grid[r][c - 1]) return false;
        if (inBounds(r, c + 1) && grid[r][c + 1]) return false;
      }
    }
    return true;
  };

  const place = (word: string, emoji: string, row: number, col: number, dir: Direction) => {
    for (let i = 0; i < word.length; i++) {
      const r = dir === "down" ? row + i : row;
      const c = dir === "across" ? col + i : col;
      grid[r][c] = word[i];
    }
    placements.push({ word, emoji, row, col, direction: dir });
  };

  const candidates = pool
    .map((e) => ({ emoji: e.emoji, word: cleanWord(e.name) }))
    .filter((e) => e.word.length >= MIN_WORD_LEN && e.word.length <= MAX_WORD_LEN);

  if (candidates.length === 0) return { placements: [] };

  const shuffled = fisherYatesShuffle(candidates);
  let seedIndex = shuffled.findIndex((w) => w.word.length >= 5);
  if (seedIndex === -1) seedIndex = 0;
  const seed = shuffled[seedIndex];
  const rest = shuffled.filter((_, i) => i !== seedIndex);

  const startRow = Math.floor(GRID_SIZE / 2);
  const startCol = Math.floor((GRID_SIZE - seed.word.length) / 2);
  place(seed.word, seed.emoji, startRow, startCol, "across");

  for (const candidate of rest) {
    if (placements.length >= targetCount) break;
    if (placements.some((p) => p.word === candidate.word)) continue;

    outer: for (const existing of placements) {
      for (let ei = 0; ei < existing.word.length; ei++) {
        const letter = existing.word[ei];
        for (let ci = 0; ci < candidate.word.length; ci++) {
          if (candidate.word[ci] !== letter) continue;

          const newDir: Direction = existing.direction === "across" ? "down" : "across";
          const row = existing.direction === "across" ? existing.row - ci : existing.row + ei;
          const col = existing.direction === "across" ? existing.col + ei : existing.col - ci;

          if (canPlace(candidate.word, row, col, newDir)) {
            place(candidate.word, candidate.emoji, row, col, newDir);
            break outer;
          }
        }
      }
    }
  }

  return { placements };
}

// Build grid data
function buildPuzzle(placements: Placement[]) {
  const empty = {
    cells: [] as Cell[][],
    rows: 0,
    cols: 0,
    clues: { across: [] as Clue[], down: [] as Clue[] },
  };
  if (placements.length === 0) return empty;

  let minRow = Infinity, maxRow = -Infinity, minCol = Infinity, maxCol = -Infinity;
  placements.forEach((p) => {
    const endRow = p.direction === "down" ? p.row + p.word.length - 1 : p.row;
    const endCol = p.direction === "across" ? p.col + p.word.length - 1 : p.col;
    minRow = Math.min(minRow, p.row);
    maxRow = Math.max(maxRow, endRow);
    minCol = Math.min(minCol, p.col);
    maxCol = Math.max(maxCol, endCol);
  });

  const rows = maxRow - minRow + 1;
  const cols = maxCol - minCol + 1;
  const cells: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      letter: null,
      number: null,
      acrossStart: false,
      downStart: false,
    }))
  );

  placements.forEach((p) => {
    for (let i = 0; i < p.word.length; i++) {
      const r = (p.direction === "down" ? p.row + i : p.row) - minRow;
      const c = (p.direction === "across" ? p.col + i : p.col) - minCol;
      cells[r][c].letter = p.word[i];
    }
  });

  let counter = 1;
  const numberAt = new Map<string, number>();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!cells[r][c].letter) continue;
      const startsAcross = (c === 0 || !cells[r][c - 1].letter) && c + 1 < cols && !!cells[r][c + 1].letter;
      const startsDown = (r === 0 || !cells[r - 1][c].letter) && r + 1 < rows && !!cells[r + 1][c].letter;
      if (startsAcross || startsDown) {
        numberAt.set(`${r}-${c}`, counter);
        cells[r][c].number = counter;
        counter++;
      }
    }
  }

  const across: Clue[] = [];
  const down: Clue[] = [];
  placements.forEach((p) => {
    const r = p.row - minRow;
    const c = p.col - minCol;
    const number = numberAt.get(`${r}-${c}`)!;
    const entry = { number, word: p.word, emoji: p.emoji };
    (p.direction === "across" ? across : down).push(entry);
  });
  across.sort((a, b) => a.number - b.number);
  down.sort((a, b) => a.number - b.number);

  return { cells, rows, cols, clues: { across, down } };
}

const CELL_SIZE = 26;

// Main component entry
export default function CrosswordGame() {
  const pathname = usePathname();

  // Memoize random puzzle
  const puzzle = useMemo(() => {
    const pool = fisherYatesShuffle(emojis as WordEntry[]);
    const { placements } = generateCrossword(pool, 7);
    return buildPuzzle(placements);
  }, []);

  const { cells, rows, cols, clues } = puzzle;

  // Track player input
  const [answers, setAnswers] = useState<string[][]>(() =>
    Array.from({ length: rows }, () => Array(cols).fill(""))
  );
  const [checked, setChecked] = useState(false);
  const [focusedCell, setFocusedCell] = useState<CellCoord | null>(null);
  const [direction, setDirection] = useState<Direction>("across");
  const inputRefs = useRef<Record<string, TextInput | null>>({});

  // Check horizontal layout
  const hasAcross = (r: number, c: number) =>
    (c > 0 && !!cells[r][c - 1].letter) || (c + 1 < cols && !!cells[r][c + 1].letter);
    
  // Check vertical layout
  const hasDown = (r: number, c: number) =>
    (r > 0 && !!cells[r - 1][c].letter) || (r + 1 < rows && !!cells[r + 1][c].letter);

  // Get front cell (Next item downward if layout is vertical, rightward if horizontal)
  const getNextCell = (r: number, c: number, dir: Direction): CellCoord | null => {
    const nr = dir === "down" ? r + 1 : r;
    const nc = dir === "across" ? c + 1 : c;
    if (nr < rows && nc < cols && cells[nr][nc].letter) return { r: nr, c: nc };
    return null;
  };
  
  // Get rear cell (Previous item upward if layout is vertical, leftward if horizontal)
  const getPrevCell = (r: number, c: number, dir: Direction): CellCoord | null => {
    const pr = dir === "down" ? r - 1 : r;
    const pc = dir === "across" ? c - 1 : c;
    if (pr >= 0 && pc >= 0 && cells[pr][pc].letter) return { r: pr, c: pc };
    return null;
  };

  // Manage field focus
  const focusCell = (coord: CellCoord) => {
    setFocusedCell(coord);
    inputRefs.current[`${coord.r}-${coord.c}`]?.focus();
  };

  // Handle cell selection
  const handleCellPress = (r: number, c: number) => {
    const sameCell = !!focusedCell && focusedCell.r === r && focusedCell.c === c;
    const acrossOk = hasAcross(r, c);
    const downOk = hasDown(r, c);

    setDirection((prev) => {
      if (sameCell && acrossOk && downOk) return prev === "across" ? "down" : "across";
      if (prev === "across" && acrossOk) return "across";
      if (prev === "down" && downOk) return "down";
      return acrossOk ? "across" : "down";
    });
    focusCell({ r, c });
  };

  // Process typed characters & Backspaces
  const handleChange = (r: number, c: number, value: string) => {
    // 1. CLEAR/CROSS SIGN ACTIONS (Fires when deleting contents)
    if (value === "") {
      setAnswers((prev) => {
        const next = prev.map((row) => [...row]);
        next[r][c] = "";
        return next;
      });

      // Moves focus UPWARD if direction is 'down', or BACKWARD if 'across'
      const prevCell = getPrevCell(r, c, direction);
      if (prevCell) {
        focusCell(prevCell);
      }
      return;
    }

    // 2. FILLING THE CELL (Typing any letter)
    const letter = value.slice(-1).toUpperCase();
    setAnswers((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = letter;
      return next;
    });
    setChecked(false);

    if (letter) {
      // Moves focus DOWNWARD if direction is 'down', or RIGHT if 'across'
      const next = getNextCell(r, c, direction);
      if (next) focusCell(next);
    }
  };

  // Safe manual override catch for unexpected device specific deletes
  const handleKeyPress = (r: number, c: number, key: string) => {
    if (key === "Backspace") {
      setAnswers((prev) => {
        const next = prev.map((row) => [...row]);
        next[r][c] = "";
        return next;
      });
      setChecked(false);

      const prevCell = getPrevCell(r, c, direction);
      if (prevCell) {
        focusCell(prevCell);
      }
    }
  };
  // Reveal correct character
  const handleHint = () => {
    if (!focusedCell) return;
    const { r, c } = focusedCell;
    const letter = cells[r][c].letter;
    if (!letter) return;
    setAnswers((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = letter;
      return next;
    });
  };

  // Check matching character
  const isCellCorrect = (r: number, c: number) =>
    !!answers[r][c] && !!cells[r][c].letter && answers[r][c] === cells[r][c].letter;

  // Check total completion
  const isFilled =
    rows > 0 && cells.every((row, r) => row.every((cell, c) => !cell.letter || !!answers[r][c]));

  // Verify entire board
  const isComplete =
    rows > 0 &&
    cells.every((row, r) => row.every((cell, c) => !cell.letter || isCellCorrect(r, c)));

  // Fallback empty view
  if (rows === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Crossword</Text>
        <Text style={styles.emptyText}>
          Not enough words to build a puzzle right now. Add a few more entries to emojis.json and try again!
        </Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>⬅ Back to Hub</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <LinearGradient colors={["#f1adb0", "#9edbdf"]} style={styles.gradient}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ alignItems: "flex-start", marginTop: 20 }}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Emoji Crossword</Text>
        </View>

        {/* Render game board */}
        <View style={styles.gridWrapper}>
          {cells.map((row, r) => (
            <View key={`row-${r}`} style={{ flexDirection: "row" }}>
              {row.map((cell, c) => {
                if (!cell.letter) {
                  return <View key={`cell-${r}-${c}`} style={styles.blankCell} />;
                }
                const correct = checked && isCellCorrect(r, c);
                const wrong = checked && !!answers[r][c] && !isCellCorrect(r, c);
                const isFocused = !!focusedCell && focusedCell.r === r && focusedCell.c === c;
                return (
                  <Pressable
                    key={`cell-${r}-${c}`}
                    style={[styles.cellWrapper, isFocused && styles.cellFocused]}
                    onPress={() => handleCellPress(r, c)}
                  >
                    {cell.number !== null && <Text style={styles.cellNumber}>{cell.number}</Text>}
                    <TextInput
                      ref={(ref) => {
                        inputRefs.current[`${r}-${c}`] = ref;
                      }}
                      pointerEvents="none"
                      style={[styles.cellInput, correct && styles.cellCorrect, wrong && styles.cellWrong]}
                      maxLength={1}
                      autoCapitalize="characters"
                      value={answers[r][c]}
                      onFocus={() => setFocusedCell({ r, c })}
                      onChangeText={(v) => handleChange(r, c, v)}
                      onKeyPress={(e) => handleKeyPress(r, c, e.nativeEvent.key)}
                      
                      // 3. ENTER SIGN HANDLER (Drives movement down in vertical layout)
                      onSubmitEditing={() => {
                        const next = getNextCell(r, c, direction);
                        if (next) focusCell(next);
                      }}
                      blurOnSubmit={false}
                    />
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {/* Display emoji hints */}
        <View style={styles.cluesWrapper}>
          <View style={styles.clueColumn}>
            <Text style={styles.clueHeading}>Across</Text>
            {clues.across.map((clue) => (
              <Text key={`a-${clue.number}`} style={styles.clueText}>
                {clue.number}. {clue.emoji}
              </Text>
            ))}
          </View>
          <View style={styles.clueColumn}>
            <Text style={styles.clueHeading}>Down</Text>
            {clues.down.map((clue) => (
              <Text key={`d-${clue.number}`} style={styles.clueText}>
                {clue.number}. {clue.emoji}
              </Text>
            ))}
          </View>
        </View>

        {/* User action options */}
        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.hintButton, !focusedCell && styles.buttonDisabled]}
            onPress={handleHint}
            disabled={!focusedCell}
          >
            <Text style={styles.checkButtonText}>💡 Hint</Text>
          </Pressable>

          <Pressable
            style={[styles.checkButton, !isFilled && styles.buttonDisabled]}
            onPress={() => setChecked(true)}
            disabled={!isFilled}
          >
            <Text style={styles.checkButtonText}>Check my answers</Text>
          </Pressable>
        </View>
        {!isFilled && (
          <Text style={styles.helperText}>Fill in every box to unlock checking!</Text>
        )}

        {/* Mascot feedback view */}
        <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 20 }}>
          <Image source={require("../../assets/mimoimg.png")} style={{ width: 70, height: 80 }} resizeMode="cover" />
          <View style={styles.mimoSpeech}>
            <Text style={styles.mimoSpeechText}>
              {isComplete
                ? "🎉 Amazing! You solved the whole crossword!"
                : checked
                ? "Keep going, a few letters need another try!"
                : "👋 Hi, I’m Mimo! Tap a box, look at the emoji clues, and start typing. Stuck? Tap a box and press Hint!"}
            </Text>
            {isComplete && (
              <Pressable style={styles.playAgainButton} onPress={() => router.replace(pathname as any)}>
                <Text style={{ color: "#fff", fontWeight: "600", textAlign: "center" }}>Play Again</Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>

      {isComplete && <ConfettiCannon count={70} origin={{ x: 200, y: 0 }} fadeOut />}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1, padding: 20 },
  header: { flexDirection: "row", alignItems: "center", marginTop: 20, marginBottom: 15 },
  title: {
    fontSize: 28,
    fontFamily: "Times New Roman",
    fontWeight: "700",
    textAlign: "center",
    color: "#011e1f",
    flex: 1,
  },
  gridWrapper: {
    alignSelf: "center",
    backgroundColor: "#011e1f",
    padding: 2,
    borderRadius: 6,
  },
  blankCell: { width: CELL_SIZE, height: CELL_SIZE, margin: 1 },
  cellWrapper: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    margin: 1,
    backgroundColor: "#fff",
    borderRadius: 3,
  },
  cellFocused: { backgroundColor: "#cfe8ff" },
  cellNumber: {
    position: "absolute",
    top: 1,
    left: 2,
    fontSize: 8,
    fontWeight: "700",
    color: "#264994",
    zIndex: 1,
  },
  cellInput: {
    flex: 1,
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "#011e1f",
    padding: 0,
    backgroundColor: "transparent",
  },
  cellCorrect: { backgroundColor: "#d5f096", borderRadius: 3 },
  cellWrong: { backgroundColor: "#f7b3ad", borderRadius: 3 },
  cluesWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderRadius: 12,
    padding: 12,
  },
  clueColumn: { flex: 1, paddingHorizontal: 8 },
  clueHeading: { fontSize: 16, fontWeight: "800", color: "#264994", marginBottom: 8 },
  clueText: { fontSize: 20, marginBottom: 10 },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 16,
  },
  hintButton: {
    backgroundColor: "#fbbf24",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  checkButton: {
    backgroundColor: "#318ef8",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  buttonDisabled: { opacity: 0.4 },
  checkButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  helperText: {
    textAlign: "center",
    marginTop: 8,
    color: "#264994",
    fontWeight: "600",
    fontSize: 13,
  },
  mimoSpeech: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#e7d8bb",
    borderRadius: 12,
    alignSelf: "center",
    maxWidth: "80%",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  mimoSpeechText: { fontSize: 15, fontWeight: "500", color: "#333", textAlign: "center" },
  playAgainButton: { marginTop: 8, padding: 6, backgroundColor: "#318ef8", borderRadius: 8 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  emptyTitle: { fontSize: 24, fontWeight: "700", marginBottom: 20 },
  emptyText: { fontSize: 16, color: "#666", textAlign: "center", marginBottom: 20 },
  backButton: { marginTop: 20, padding: 10, backgroundColor: "#318ef8", borderRadius: 8 },
  backText: { color: "#fff", fontWeight: "600" },
});