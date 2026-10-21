import { describe, expect, it } from "vitest";
import { buildSlides, clampSlideIndex, slideIndexForKey } from "./presentation";
import type { Song, SongSection } from "./types";

function section(id: string, lineCount: number): SongSection {
  return {
    id,
    type: "verse",
    label: id,
    lines: Array.from({ length: lineCount }, (_, index) => ({
      id: `${id}-l${index + 1}`,
      text: `Linha ${index + 1}`,
      chords: [],
    })),
  };
}

function song(...sections: SongSection[]): Song {
  return { id: "a", slug: "a", title: "Alfa", sections };
}

describe("buildSlides", () => {
  it("gera um slide por seção quando cabe no limite de linhas", () => {
    const slides = buildSlides(song(section("s1", 3), section("s2", 4)));
    expect(
      slides.map((slide) => [
        slide.section.id,
        slide.lines.length,
        slide.part,
        slide.parts,
      ]),
    ).toEqual([
      ["s1", 3, 1, 1],
      ["s2", 4, 1, 1],
    ]);
  });

  it("divide seções longas em partes equilibradas sem perder linhas", () => {
    const slides = buildSlides(song(section("s1", 5)));
    expect(slides.map((slide) => slide.lines.length)).toEqual([3, 2]);
    expect(slides.map((slide) => [slide.part, slide.parts])).toEqual([
      [1, 2],
      [2, 2],
    ]);
    expect(
      slides.flatMap((slide) => slide.lines.map((item) => item.id)),
    ).toEqual(["s1-l1", "s1-l2", "s1-l3", "s1-l4", "s1-l5"]);
  });

  it("respeita um limite de linhas customizado", () => {
    expect(
      buildSlides(song(section("s1", 6)), 2).map((slide) => slide.lines.length),
    ).toEqual([2, 2, 2]);
  });

  it("mantém um slide para seção sem linhas e usa ids únicos", () => {
    const slides = buildSlides(song(section("s1", 0), section("s2", 9)));
    expect(slides[0]?.lines).toEqual([]);
    expect(new Set(slides.map((slide) => slide.id)).size).toBe(slides.length);
  });

  it("devolve lista vazia sem músicas ou seções", () => {
    expect(buildSlides(null)).toEqual([]);
    expect(buildSlides(song())).toEqual([]);
  });
});

describe("clampSlideIndex", () => {
  it("mantém o índice dentro dos slides existentes", () => {
    expect(clampSlideIndex(-3, 4)).toBe(0);
    expect(clampSlideIndex(2, 4)).toBe(2);
    expect(clampSlideIndex(9, 4)).toBe(3);
    expect(clampSlideIndex(5, 0)).toBe(0);
  });
});

describe("slideIndexForKey", () => {
  it("avança e retorna com as setas e Page Up/Down", () => {
    expect(slideIndexForKey("ArrowRight", 1, 5)).toBe(2);
    expect(slideIndexForKey("PageDown", 1, 5)).toBe(2);
    expect(slideIndexForKey("ArrowLeft", 1, 5)).toBe(0);
    expect(slideIndexForKey("PageUp", 1, 5)).toBe(0);
  });

  it("para nos limites", () => {
    expect(slideIndexForKey("ArrowLeft", 0, 5)).toBe(0);
    expect(slideIndexForKey("ArrowRight", 4, 5)).toBe(4);
  });

  it("vai ao primeiro e ao último com Home e End", () => {
    expect(slideIndexForKey("Home", 3, 5)).toBe(0);
    expect(slideIndexForKey("End", 1, 5)).toBe(4);
  });

  it("ignora outras teclas e listas vazias", () => {
    expect(slideIndexForKey("a", 1, 5)).toBeNull();
    expect(slideIndexForKey("ArrowRight", 0, 0)).toBeNull();
  });
});
