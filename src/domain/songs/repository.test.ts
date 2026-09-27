import { describe, expect, it } from "vitest";
import { parseLibraryState, parseSongs, serializeSongs, slugify } from "./repository";
import type { Song } from "./types";

const song: Song = {
  id: "1",
  slug: "uma-musica",
  title: "Uma Música",
  sections: [
    {
      id: "s1",
      type: "verse",
      lines: [{ id: "l1", text: "Linha", chords: [{ chord: "G", position: 0 }] }],
    },
  ],
};

describe("song repository serialization", () => {
  it("serializes and parses a song without losing structure", () => {
    expect(parseSongs(serializeSongs([song]))).toEqual([song]);
  });

  it("rejects invalid collections", () => {
    expect(parseSongs(JSON.stringify([{ id: 1 }]))).toEqual([]);
    expect(parseSongs("invalid")).toEqual([]);
  });

  it("normalizes a slug", () => {
    expect(slugify("Minha Música!")).toBe("minha-musica");
  });

  it("normalizes an incomplete library state", () => {
    expect(parseLibraryState(JSON.stringify({ favorites: [123], theme: "unknown" }))).toEqual({
      favorites: [],
      recent: [],
      playlists: [],
      theme: "purple",
      playerPreferences: {
        fontScale: 1,
        lineSpacing: 1.75,
        maxWidth: "comfortable",
        highContrast: false,
        autoScroll: true,
      },
    });
  });
});
