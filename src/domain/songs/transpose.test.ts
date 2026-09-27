import { describe, expect, it } from "vitest";
import { transposeChord, transposeKey } from "./transpose";

describe("transposeChord", () => {
  it("moves a major chord by one semitone", () => {
    expect(transposeChord("C", 1)).toBe("C#");
  });

  it("keeps the chord suffix", () => {
    expect(transposeChord("Am7", 2)).toBe("Bm7");
  });

  it("handles flats and wrap around", () => {
    expect(transposeChord("Bb", 2)).toBe("C");
    expect(transposeChord("B", 1)).toBe("C");
  });

  it("keeps unknown text unchanged", () => {
    expect(transposeChord("N.C.", 2)).toBe("N.C.");
  });
});

describe("transposeKey", () => {
  it("returns undefined when key is absent", () => {
    expect(transposeKey(undefined, 2)).toBeUndefined();
  });
});
