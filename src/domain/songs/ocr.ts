import { createWorker } from "tesseract.js";
import type { SongSection, SongSectionType } from "./types";

const OCR_LOW_CONFIDENCE = 70;
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
  source: "image" | "pdf";
};

type OcrLine = { text: string; confidence: number };

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

  for (const [index, item] of lines.entries()) {
    const text = item.text.trim().replace(/[ \t]+/g, " ");
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
      continue;
    }
    current.lines.push({
      id: `ocr-line-${Date.now()}-${index}`,
      text,
      chords: [],
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
    const result = await worker.recognize(blob);
    return (result.data.lines ?? []).map((line) => ({ text: line.text, confidence: line.confidence }));
  } finally {
    await worker.terminate();
  }
}

async function renderPdfPages(file: Blob): Promise<Blob[]> {
  const pdfjs = await import("pdfjs-dist");
  const document = await pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    disableAutoFetch: true,
    disableStream: true,
  }).promise;

  if (document.numPages > MAX_PDF_PAGES) {
    await document.destroy();
    throw new Error(`O PDF excede o limite de ${MAX_PDF_PAGES} páginas para OCR.`);
  }

  const images: Blob[] = [];
  try {
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = Math.min(1.75, MAX_RENDER_WIDTH / baseViewport.width);
      const viewport = page.getViewport({ scale: Math.max(scale, 1) });
      const canvas = new OffscreenCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Não foi possível preparar a página do PDF para OCR.");
      await page.render({ canvasContext: context as CanvasRenderingContext2D, viewport }).promise;
      const blob = await canvas.convertToBlob({ type: "image/png" });
      images.push(blob);
      page.cleanup();
    }
  } finally {
    await document.destroy();
  }
  return images;
}

export async function extractSongFromOriginal(
  file: Blob,
  mimeType: string,
  onProgress?: (progress: OcrProgress) => void,
): Promise<OcrExtraction> {
  onProgress?.({ stage: "preparing", progress: 0 });
  const source = mimeType === "application/pdf" ? "pdf" : "image";
  let lines: OcrLine[] = [];

  if (source === "pdf") {
    const pages = await renderPdfPages(file);
    for (const [index, page] of pages.entries()) {
      const pageLines = await recognizeImage(page, (progress) => {
        const base = index / pages.length;
        onProgress?.({
          stage: progress.stage,
          progress: Math.round((base + progress.progress / 100 / pages.length) * 100),
        });
      });
      lines = [...lines, ...pageLines];
    }
  } else {
    lines = await recognizeImage(file, onProgress);
  }

  onProgress?.({ stage: "finalizing", progress: 100 });
  return { ...buildSections(lines), source };
}
