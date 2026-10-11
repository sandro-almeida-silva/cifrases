import { describe, expect, it } from "vitest";
import {
  addSongToPlaylist,
  createPlaylist,
  deletePlaylist,
  moveSongInPlaylist,
  removeSongFromPlaylist,
  renamePlaylist,
} from "./playlists";

const base = [{ id: "p1", name: "Culto", songIds: ["a", "b", "c"] }];

describe("playlists", () => {
  it("creates a playlist with a trimmed name and no songs", () => {
    expect(createPlaylist([], "  Domingo  ", "p9")).toEqual([{ id: "p9", name: "Domingo", songIds: [] }]);
  });

  it("ignores blank names", () => {
    expect(createPlaylist(base, "   ", "p2")).toBe(base);
  });

  it("renames and deletes a playlist", () => {
    expect(renamePlaylist(base, "p1", " Noite ")[0]?.name).toBe("Noite");
    expect(renamePlaylist(base, "p1", " ")).toBe(base);
    expect(deletePlaylist(base, "p1")).toEqual([]);
  });

  it("adds a song once and keeps the same song available in other playlists", () => {
    const two = [...base, { id: "p2", name: "Ensaio", songIds: [] }];
    const added = addSongToPlaylist(two, "p2", "a");
    expect(added[1]?.songIds).toEqual(["a"]);
    expect(added[0]?.songIds).toEqual(["a", "b", "c"]);
    expect(addSongToPlaylist(added, "p2", "a")).toBe(added);
  });

  it("removes a song", () => {
    expect(removeSongFromPlaylist(base, "p1", "b")[0]?.songIds).toEqual(["a", "c"]);
  });

  it("reorders songs and stops at the edges", () => {
    expect(moveSongInPlaylist(base, "p1", "c", -1)[0]?.songIds).toEqual(["a", "c", "b"]);
    expect(moveSongInPlaylist(base, "p1", "a", 1)[0]?.songIds).toEqual(["b", "a", "c"]);
    expect(moveSongInPlaylist(base, "p1", "a", -1)).toBe(base);
    expect(moveSongInPlaylist(base, "p1", "c", 1)).toBe(base);
  });
});
