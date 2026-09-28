import { describe, expect, it } from "vitest";
import { recognizeChords } from "@/domain/songs/ocr";

describe("recognizeChords", () => {
  it("recognizes common chord forms and preserves character positions", () => {
    expect(recognizeChords("C      G      Am      F")).toEqual({
      chords: [
        { chord: "C", position: 0, ocrConfidence: 100, ocrNeedsReview: false },
        { chord: "G", position: 7, ocrConfidence: 100, ocrNeedsReview: false },
        { chord: "Am", position: 14, ocrConfidence: 100, ocrNeedsReview: false },
        { chord: "F", position: 21, ocrConfidence: 100, ocrNeedsReview: false },
      ],
      reviewCount: 0,
    });
  });

  it("accepts extensions, alterations and slash chords", () => {
    expect(recognizeChords("F#m7 Cadd9 Dsus4 G/B")).toMatchObject({
      chords: [
        { chord: "F#m7", position: 0 },
        { chord: "Cadd9", position: 6 },
        { chord: "Dsus4", position: 12 },
        { chord: "G/B", position: 18 },
      ],
      reviewCount: 0,
    });
  });

  it("flags low-confidence OCR chords without discarding them", () => {
    const result = recognizeChords("C G Am", [
      { text: "C", confidence: 96 },
      { text: "G", confidence: 61 },
      { text: "Am", confidence: 94 },
    ]);

    expect(result.chords[1]).toEqual({
      chord: "G",
      position: 2,
      ocrConfidence: 61,
      ocrNeedsReview: true,
    });
    expect(result.reviewCount).toBe(1);
  });

  it("does not treat ordinary words as chords", () => {
    expect(recognizeChords("Quando voce chegou e eu pude cantar").chords).toEqual([]);
  });
});
