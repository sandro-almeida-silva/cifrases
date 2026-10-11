import { describe, expect, it } from "vitest";
import { parseChordSheet } from "./chord-sheet";

describe("parseChordSheet", () => {
  it("places chords above the lyric at the same character position", () => {
    const draft = parseChordSheet(
      ["C       G", "Quando voce chegou"].join("\n"),
    );

    expect(draft.sections).toHaveLength(1);
    expect(draft.sections[0]?.lines).toEqual([
      {
        id: "line-1-1",
        text: "Quando voce chegou",
        chords: [
          { chord: "C", position: 0 },
          { chord: "G", position: 8 },
        ],
      },
    ]);
  });

  it("turns section markers into sections", () => {
    const draft = parseChordSheet(
      [
        "[Intro]",
        "C G",
        "",
        "[Refrão]",
        "Am",
        "La la la",
        "",
        "Ponte:",
        "F",
        "Ooh",
      ].join("\n"),
    );

    expect(
      draft.sections.map((section) => [section.type, section.label]),
    ).toEqual([
      ["intro", "Introdução"],
      ["chorus", "Refrão"],
      ["bridge", "Ponte"],
    ]);
    expect(draft.sections[0]?.lines[0]).toMatchObject({
      text: "",
      chords: [
        { chord: "C", position: 0 },
        { chord: "G", position: 2 },
      ],
    });
  });

  it("uses a single verse section when there are no markers", () => {
    const draft = parseChordSheet(
      ["Am", "Primeira linha", "F", "Segunda linha"].join("\n"),
    );

    expect(draft.sections).toHaveLength(1);
    expect(draft.sections[0]).toMatchObject({ type: "verse", label: "Verso" });
    expect(draft.sections[0]?.lines).toHaveLength(2);
  });

  it("accepts lyrics without chords", () => {
    const draft = parseChordSheet(
      ["Primeira linha", "Segunda linha"].join("\n"),
    );

    expect(draft.sections[0]?.lines.map((line) => line.text)).toEqual([
      "Primeira linha",
      "Segunda linha",
    ]);
    expect(draft.sections[0]?.lines.every((line) => !line.chords?.length)).toBe(
      true,
    );
  });

  it("does not read lowercase Portuguese words as chords", () => {
    const draft = parseChordSheet(["e a", "e a vida segue"].join("\n"));

    expect(draft.sections[0]?.lines.map((line) => line.text)).toEqual([
      "e a",
      "e a vida segue",
    ]);
    expect(draft.sections[0]?.lines.every((line) => !line.chords?.length)).toBe(
      true,
    );
  });

  it("clamps chords that sit beyond the end of a short lyric", () => {
    const draft = parseChordSheet(["C         G", "Oi"].join("\n"));

    expect(draft.sections[0]?.lines[0]?.chords).toEqual([
      { chord: "C", position: 0 },
      { chord: "G", position: 1 },
    ]);
  });

  it("keeps consecutive chord lines instead of dropping them", () => {
    const draft = parseChordSheet(["C G", "Am F", "Letra"].join("\n"));

    expect(draft.sections[0]?.lines).toHaveLength(2);
    expect(draft.sections[0]?.lines[0]).toMatchObject({
      text: "",
      chords: [{ chord: "C" }, { chord: "G" }],
    });
    expect(draft.sections[0]?.lines[1]).toMatchObject({ text: "Letra" });
  });

  it("reads title, artist and key from explicit fields", () => {
    const draft = parseChordSheet(
      [
        "Título: Tua Graça",
        "Artista: Banda Exemplo",
        "Tom: D",
        "",
        "D",
        "Letra",
      ].join("\n"),
    );

    expect(draft).toMatchObject({
      title: "Tua Graça",
      artist: "Banda Exemplo",
      key: "D",
    });
    expect(draft.sections[0]?.lines).toHaveLength(1);
  });

  it("reads 'Title - Artist' from the first line when followed by a blank line", () => {
    const draft = parseChordSheet(
      ["Tua Graça - Banda Exemplo", "", "D", "Letra"].join("\n"),
    );

    expect(draft).toMatchObject({
      title: "Tua Graça",
      artist: "Banda Exemplo",
    });
    expect(draft.sections[0]?.lines).toHaveLength(1);
  });

  it("handles Windows line endings and empty input", () => {
    expect(parseChordSheet("C\r\nLetra").sections[0]?.lines[0]?.text).toBe(
      "Letra",
    );
    expect(parseChordSheet("   \n  ").sections).toEqual([]);
  });
});
