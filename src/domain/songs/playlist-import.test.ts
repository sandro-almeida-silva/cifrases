import { describe, expect, it } from "vitest";
import { buildPlan, parseSongList, planSongIds, resolveEntry } from "./playlist-import";
import type { Song } from "./types";

function song(id: string, title: string, artist?: string): Song {
  return { id, slug: id, title, ...(artist ? { artist } : {}), sections: [] };
}

describe("parseSongList", () => {
  it("reads one song per line and ignores blanks", () => {
    expect(parseSongList("Alfa\n\n  Beta  \n")).toEqual([{ title: "Alfa" }, { title: "Beta" }]);
  });

  it("removes numbering and bullets", () => {
    expect(parseSongList("1. Alfa\n2) Beta\n- Gama\n• Delta").map((item) => item.title)).toEqual([
      "Alfa",
      "Beta",
      "Gama",
      "Delta",
    ]);
  });

  it("splits title and artist", () => {
    expect(parseSongList("Tua Graça - Banda Exemplo\nOutra – Fulano")).toEqual([
      { title: "Tua Graça", artist: "Banda Exemplo" },
      { title: "Outra", artist: "Fulano" },
    ]);
  });
});

describe("buildPlan", () => {
  const library = [song("a", "Tua Graça", "Banda Exemplo"), song("b", "Tua Graça", "Outro"), song("c", "Beta")];

  it("matches titles ignoring case and accents", () => {
    const plan = buildPlan([{ title: "BETA" }, { title: "tua graca" }], library);
    expect(plan.map((entry) => entry.songId)).toEqual(["c", "a"]);
  });

  it("uses the artist to disambiguate", () => {
    const plan = buildPlan([{ title: "Tua Graça", artist: "outro" }], library);
    expect(plan[0]?.songId).toBe("b");
  });

  it("leaves unknown songs unresolved and keeps order", () => {
    const plan = buildPlan([{ title: "Beta" }, { title: "Inexistente" }, { title: "Tua Graça" }], library);
    expect(plan.map((entry) => entry.songId)).toEqual(["c", undefined, "a"]);
  });
});

describe("plan to playlist", () => {
  it("keeps list order, skips pending and avoids duplicates", () => {
    const plan = [{ title: "A", songId: "a" }, { title: "B" }, { title: "C", songId: "c" }, { title: "A2", songId: "a" }];
    expect(planSongIds(plan)).toEqual(["a", "c"]);
  });

  it("places a resolved entry at its original position", () => {
    const plan = [{ title: "A", songId: "a" }, { title: "B" }, { title: "C", songId: "c" }];
    const resolved = resolveEntry(plan, 1, "b");
    expect(planSongIds(resolved)).toEqual(["a", "b", "c"]);
    expect(plan[1]?.songId).toBeUndefined();
  });
});
