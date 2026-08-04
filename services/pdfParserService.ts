// services/pdfParserService.ts
const applyShims = (): void => {
  if (typeof globalThis !== 'undefined' && !(globalThis as Record<string, any>)['DOMMatrix']) {
    (globalThis as Record<string, any>)['DOMMatrix'] = class DOMMatrix {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      constructor(init?: unknown) {
        if (typeof init === 'string') return;
        if (Array.isArray(init)) {
          this.a = (init[0] as number) ?? 1; this.b = (init[1] as number) ?? 0;
          this.c = (init[2] as number) ?? 0; this.d = (init[3] as number) ?? 1;
          this.e = (init[4] as number) ?? 0; this.f = (init[5] as number) ?? 0;
        } else if (typeof init === 'object' && init !== null) {
          const obj = init as Record<string, number>;
          this.a = obj['a'] ?? 1; this.b = obj['b'] ?? 0;
          this.c = obj['c'] ?? 0; this.d = obj['d'] ?? 1;
          this.e = obj['e'] ?? 0; this.f = obj['f'] ?? 0;
        }
      }
    };
  }
};

applyShims();

export interface ParsedPage {
  pageNumber: number;
  text: string;
  sentences: string[];
  syllableMap: Array<{ original: string; split: string }>;
}

export const splitIntoSyllables = (word: string): string => {
  const cleanWord = word.trim();
  if (cleanWord.length < 6 || /[^a-zA-Z]/.test(cleanWord)) {
    return cleanWord;
  }

  const lower = cleanWord.toLowerCase();
  const vowels = "aeiouy";
  const vowelIndices: number[] = [];

  for (let i = 0; i < cleanWord.length; i++) {
    if (vowels.includes(lower[i] ?? "")) {
      if (i === cleanWord.length - 1 && lower[i] === 'e' && i > 0 && !vowels.includes(lower[i - 1] ?? "")) {
        continue;
      }
      vowelIndices.push(i);
    }
  }

  if (vowelIndices.length < 2) {
    return cleanWord;
  }

  let result = "";
  let lastCut = 0;

  for (let k = 0; k < vowelIndices.length - 1; k++) {
    const v1 = vowelIndices[k] ?? 0;
    const v2 = vowelIndices[k + 1] ?? 0;
    const consonantsBetween = v2 - v1 - 1;
    let cutPoint = -1;

    if (consonantsBetween === 1) {
      cutPoint = v1 + 1;
    } else if (consonantsBetween === 2) {
      cutPoint = v1 + 2;
    } else if (consonantsBetween > 2) {
      cutPoint = v1 + Math.floor(consonantsBetween / 2) + 1;
    }

    if (cutPoint > lastCut && cutPoint < cleanWord.length) {
      result += cleanWord.slice(lastCut, cutPoint) + "·";
      lastCut = cutPoint;
    }
  }

  result += cleanWord.slice(lastCut);
  const strippedResult = result.replace(/·/g, "");
  if (strippedResult !== cleanWord) {
    return cleanWord;
  }

  return result;
};

export const splitIntoSentences = (text: string): string[] => {
  if (!text) return [];
  return text
    .replace(/([.?!])\s*(?=[A-Z])/g, "$1|")
    .split("|")
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 0);
};

export const buildSyllableMap = (text: string): Array<{ original: string; split: string }> => {
  const tokens = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, " ").split(/\s+/);
  const map: Array<{ original: string; split: string }> = [];
  const seen = new Set<string>();

  for (const token of tokens) {
    const cleanWord = token.trim();
    const lower = cleanWord.toLowerCase();

    if (!cleanWord || cleanWord.length < 7 || seen.has(lower)) continue;

    seen.add(lower);
    const splitResult = splitIntoSyllables(cleanWord);

    if (splitResult.includes("·") && splitResult !== cleanWord) {
      map.push({ original: cleanWord, split: splitResult });
    }
  }
  return map;
};

/**
 * PDF Parser using pdfjs-dist. Accepts a Blob (web) or a fetchable URL string.
 */
export const parsePdfDocument = async (fileInput: Blob | string): Promise<ParsedPage[]> => {
  try {
    applyShims();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs') as any;

    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc =
        `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;
    }

    let arrayBuffer: ArrayBuffer;
    if (fileInput instanceof Blob) {
      arrayBuffer = await fileInput.arrayBuffer();
    } else if (typeof fileInput === 'string') {
      const response = await fetch(fileInput);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
      }
      arrayBuffer = await response.arrayBuffer();
    } else {
      throw new Error("Invalid file type. Please supply a Blob or URL string.");
    }

    const typedArray = new Uint8Array(arrayBuffer);

    const loadingTask = pdfjs.getDocument({
      data: typedArray,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    const chunks: ParsedPage[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      const pageText = textContent.items
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((item: any) => item.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (pageText.length > 0) {
        chunks.push({
          pageNumber: i,
          text: pageText,
          sentences: splitIntoSentences(pageText),
          syllableMap: buildSyllableMap(pageText)
        });
      }
    }

    if (chunks.length > 0) return chunks;
    throw new Error("No readable text layers found inside the document structure.");

  } catch (e: unknown) {
    console.error("PDF Core Extraction Error Details:", e);
    const message = e instanceof Error ? e.message : String(e);

    return [{
      pageNumber: 1,
      text: `Parsing error occurred: ${message}`,
      sentences: [`Parsing error occurred: ${message}`],
      syllableMap: []
    }];
  }
};

/**
 * Instantly download the parsed output as a JSON file (web only).
 */
export const downloadParsedJson = (parsedData: ParsedPage[], filename: string = "pdf-extracted-output.json"): void => {
  const jsonString = JSON.stringify(parsedData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const doc = (globalThis as any).document;

  const link = doc.createElement("a");
  link.href = url;
  link.download = filename;
  doc.body.appendChild(link);
  link.click();
  doc.body.removeChild(link);
  URL.revokeObjectURL(url);
};