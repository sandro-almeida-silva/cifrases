import { describe, expect, it } from "vitest";
import { transposeChord, transposeKey } from "@/domain/songs/transpose";

describe("transposeChord", () => {
  it("transposes major and minor chords", () => {
    expect(transposeChord("C", 2)).toBe("D");
    expect(transposeChord("Am", 2)).toBe("Bm");
  });

  it("preserves seventh chords and extensions", () => {
    expect(transposeChord("G7", 2)).toBe("A7");
    expect(transposeChord("Cmaj7", 2)).toBe("Dmaj7");
    expect(transposeChord("F#m7b5", 1)).toBe("Gm7b5");
    expect(transposeChord("Dsus4", -2)).toBe("Csus4");
  });

  it("transposes slash chord bass notes", () => {
    expect(transposeChord("C/E", 2)).toBe("D/F#");
    expect(transposeChord("Bb/D", 2)).toBe("C/E");
    expect(transposeChord("G/B", -2)).toBe("F/A");
  });

  it("keeps flat and sharp notation consistent with the source", () => {
    expect(transposeChord("Bb", 2)).toBe("C");
    expect(transposeChord("Eb", 1)).toBe("E");
    expect(transposeChord("F#", 1)).toBe("G");
    expect(transposeChord("C#", -1)).toBe("C");
  });

  it("does not change unsupported input", () => {
    expect(transposeChord("N.C.", 2)).toBe("N.C.");
    expect(transposeChord("", 2)).toBe("");
  });
});

describe("transposeKey", () => {
  it("transposes the displayed key without mutating source data", () => {
    const original = "G";
    expect(transposeKey(original, 2)).toBe("A");
    expect(original).toBe("G");
    expect(transposeKey(undefined, 2)).toBeUndefined();
  });
});
