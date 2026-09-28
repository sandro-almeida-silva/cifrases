import { createWorker } from "tesseract.js";
import type { ChordPlacement, SongSection, SongSectionType } from "./types";

const OCR_LOW_CONFIDENCE = 70;
const OCR_CHORD_REVIEW_CONFIDENCE = 78;
const MAX_PDF_PAGES = 10;
const MAX_RENDER_WIDTH = 2500;
const SECTION_PATTERNS: Array<{ type: SongSectionType; pattern: RegExp; label: string }> = [
  { type: "intro", pattern: /^(intro|introdu[cç][aã]o)$/i, label: "Introdução" },
  { type: "verse", pattern: /^(verso|verse)(\s+\d+)?$/i, label: "Verso" },
  { type: "pre-chorus", pattern: /^(pr[eé]-?refr[aã]o|pre-?chorus)(\s+\d+)?$/i, label: "Pré-refrão" },
  { type: "chorus", pattern: /^(refr[aã]o|chorus)(\s+\d+)?$/i, label: "Refrão" },
  { type: "bridge", pattern: /^(ponte|bridge)$/i, label: "Ponte" },
  { type: "instrumental", pattern: /^(instrumental|solo)$/i, label: "Instrumental" },
  { type: "outro", pattern: /^(final|outro)$/i, label: "Final" },
];

export type OcrProgress = {
  stage: "preparing" | "recognizing" | "finalizing";
  progress: number;
};

export type OcrExtraction = {
  sections: SongSection[];
  confidence: number;
  lowConfidenceCount: number;
  chordReviewCount: number;
  source: "image" | "pdf";
};

type OcrWord = {
  text: string;
  confidence: number;
};

type OcrLine = {
  text: string;
  confidence: number;
  words?: OcrWord[];
};

const CHORD_TOKEN = /^[A-G](?:#|b)?(?:(?:m|min|maj|major|minor|dim|aug|sus|add|M|º|°|\+|-)?(?:2|4|5|6|7|9|11|13)?(?:sus2|sus4|add2|add4|add9|add11|add13)?)(?:\/[A-G](?:#|b)?)?$/i;

function normalizeChordToken(value: string): string {
  return value
    .trim()
    .replace(/^[\[({]+|[\])},;:]+$/g, "")
    .replace(/^[‘’'"]|[‘’'"]$/g, "");
}

function chordCandidates(text: string, words: OcrWord[] = []): Array<{ chord: string; position: number; confidence: number }> {
  const source = words.length
    ? words
    : text.split(/\s+/).filter(Boolean).map((word) => ({ text: word, confidence: 100 }));

  const result: Array<{ chord: string; position: number; confidence: number }> = [];
  let searchFrom = 0;
  for (const word of source) {
    const chord = normalizeChordToken(word.text);
    if (!CHORD_TOKEN.test(chord)) continue;
    const position = text.toLowerCase().indexOf(chord.toLowerCase(), searchFrom);
    if (position < 0) continue;
    searchFrom = position + chord.length;
    result.push({ chord, position, confidence: word.confidence });
  }
  return result;
}

function isChordOnlyLine(text: string, candidates: ReturnType<typeof chordCandidates>): boolean {
  const tokens = text.split(/\s+/).filter(Boolean);
  return tokens.length > 0 && candidates.length === tokens.length;
}

export function recognizeChords(
  text: string,
  words: OcrWord[] = [],
): { chords: ChordPlacement[]; reviewCount: number } {
  const candidates = chordCandidates(text, words);
  const chords = candidates.map((item) => ({
    chord: item.chord,
    position: item.position,
    ocrConfidence: Math.round(item.confidence),
    ocrNeedsReview: item.confidence < OCR_CHORD_REVIEW_CONFIDENCE,
  }));
  const unique = chords.filter((item, index) =>
    chords.findIndex((candidate) => candidate.chord === item.chord && candidate.position === item.position) === index,
  );
  return {
    chords: unique,
    reviewCount: unique.filter((item) => item.ocrNeedsReview).length,
  };
}

function projectChordPositions(chords: ChordPlacement[], sourceLength: number, targetLength: number): ChordPlacement[] {
  if (!chords.length || sourceLength <= 0 || targetLength <= 0) return chords;
  return chords.map((item) => ({
    ...item,
    position: Math.min(targetLength, Math.max(0, Math.round((item.position / sourceLength) * targetLength))),
  }));
}

function sectionFromHeading(text: string): { type: SongSectionType; label: string } | null {
  const normalized = text.trim().replace(/^[\[({]|[\])}]$/g, "").replace(/\s+/g, " ");
  const match = SECTION_PATTERNS.find((item) => item.pattern.test(normalized));
  return match ? { type: match.type, label: match.label } : null;
}

function buildSections(lines: OcrLine[]) {
  const sections: SongSection[] = [];
  let current: SongSection = { id: `ocr-section-${Date.now()}`, type: "verse", label: "Verso", lines: [] };
  const confidenceValues: number[] = [];
  let lowConfidenceCount = 0;
  let pendingChords: ChordPlacement[] = [];
  let pendingSourceLength = 0;

  for (const [index, item] of lines.entries()) {
    const text = item.text.trim().replace(/[ \\t]+/g, " ");
    if (!text) continue;

    const heading = sectionFromHeading(text);
    if (heading) {
      if (current.lines.length) sections.push(current);
      current = {
        id: `ocr-section-${Date.now()}-${sections.length + 1}`,
        type: heading.type,
        label: heading.label,
        lines: [],
      };
      pendingChords = [];
      pendingSourceLength = 0;
      continue;
    }

    const recognized = recognizeChords(item.text, item.words);
    const tokens = text.split(/\\s+/).filter(Boolean);
    const chordOnly = tokens.length > 0 && recognized.chords.length === tokens.length;

    if (chordOnly) {
      pendingChords = recognized.chords;
      pendingSourceLength = Math.max(text.length - 1, 1);
      continue;
    }

    const chords = pendingChords.length
      ? projectChordPositions(pendingChords, pendingSourceLength, Math.max(text.length - 1, 1))
      : recognized.chords;
    pendingChords = [];
    pendingSourceLength = 0;

    current.lines.push({
      id: `ocr-line-${Date.now()}-${index}`,
      text,
      chords,
      ocrConfidence: Math.round(item.confidence),
    });
    confidenceValues.push(item.confidence);
    if (item.confidence < OCR_LOW_CONFIDENCE) lowConfidenceCount += 1;
  }

  if (current.lines.length) sections.push(current);
  if (!sections.length) {
    sections.push({
      id: `ocr-section-${Date.now()}-0`,
      type: "verse",
      label: "Verso",
      lines: [{ id: `ocr-line-${Date.now()}-0`, text: "", chords: [] }],
    });
  }

  return {
    sections,
    confidence: confidenceValues.length
      ? Math.round(confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length)
      : 0,
    lowConfidenceCount,
  };
}

()}-${index}`,
      text,
      chords,
      ocrConfidence: Math.round(item.confidence),
    });
    confidenceValues.push(item.confidence);
    if (item.confidence < OCR_LOW_CONFIDENCE) lowConfidenceCount += 1;
  }

  if (current.lines.length) sections.push(current);
  if (!sections.length) {
    sections.push({
      id: `ocr-section-${Date.now()}-0`,
      type: "verse",
      label: "Verso",
      lines: [{ id: `ocr-line-${Date.now()}-0`, text: "", chords: [] }],
    });
  }

  return {
    sections,
    confidence: confidenceValues.length
      ? Math.round(confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length)
      : 0,
    lowConfidenceCount,
  };
}
async function recognizeImage(blob: Blob, onProgress?: (progress: OcrProgress) => void): Promise<OcrLine[]> {
  const worker = await createWorker("por", 1, {
    logger: (message) => {
      if (message.status === "recognizing text") {
        onProgress?.({ stage: "recognizing", progress: Math.round(message.progress * 100) });
      }
    },
  });

  try {
    const result = await worker.recognize(blob, {}, { blocks: true });
    return (result.data.blocks ?? []).flatMap((block) =>
      block.paragraphs.flatMap((paragraph) =>
        paragraph.lines.map((line) => ({
          text: line.text,
          confidence: line.confidence,
          words: line.words.map((word) => ({
            text: word.text,
            confidence: word.confidence,
          })),
        })),
      ),
    );
  } finally {
    await worker.terminate();
  }
}


