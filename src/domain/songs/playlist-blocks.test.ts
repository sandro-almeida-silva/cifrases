import { describe, expect, it } from "vitest";
import {
  addBlockToPlaylist,
  addSongToPlaylist,
  assignSongToBlock,
  groupPlaylist,
  moveBlockInPlaylist,
  moveSongInPlaylist,
  normalizePlaylist,
  type Playlist,
  removeBlockFromPlaylist,
  removeSongFromPlaylist,
  renameBlockInPlaylist,
} from "./playlists";

const base: Playlist[] = [
  { id: "p1", name: "Culto", songIds: ["a", "b", "c", "d"] },
];

function withBlocks(): Playlist[] {
  let state = addBlockToPlaylist(base, "p1", "Louvor", "b-louvor");
  state = addBlockToPlaylist(state, "p1", "Ceia", "b-ceia");
  return state;
}

describe("playlist blocks", () => {
  it("adds named blocks in order and ignores blank names", () => {
    const state = withBlocks();
    expect(state[0]?.blocks).toEqual([
      { id: "b-louvor", name: "Louvor" },
      { id: "b-ceia", name: "Ceia" },
    ]);
    expect(addBlockToPlaylist(state, "p1", "   ", "x")).toBe(state);
  });

  it("renames a block and rejects blank names", () => {
    const state = withBlocks();
    expect(
      renameBlockInPlaylist(state, "p1", "b-ceia", " Santa Ceia ")[0]
        ?.blocks?.[1]?.name,
    ).toBe("Santa Ceia");
    expect(renameBlockInPlaylist(state, "p1", "b-ceia", " ")).toBe(state);
  });

  it("assigns a song to a block and plays blocks in order after unassigned songs", () => {
    let state = withBlocks();
    state = assignSongToBlock(state, "p1", "a", "b-ceia");
    state = assignSongToBlock(state, "p1", "b", "b-louvor");
    expect(state[0]?.songIds).toEqual(["c", "d", "b", "a"]);
  });

  it("puts an assigned song at the end of its block", () => {
    let state = withBlocks();
    state = assignSongToBlock(state, "p1", "c", "b-louvor");
    state = assignSongToBlock(state, "p1", "a", "b-louvor");
    expect(state[0]?.songIds).toEqual(["b", "d", "c", "a"]);
  });

  it("unassigns a song with a null block", () => {
    let state = assignSongToBlock(withBlocks(), "p1", "a", "b-louvor");
    state = assignSongToBlock(state, "p1", "a", null);
    expect(state[0]?.blockBySong).toEqual({});
    expect(state[0]?.songIds).toEqual(["b", "c", "d", "a"]);
  });

  it("ignores unknown blocks and songs", () => {
    const state = withBlocks();
    expect(assignSongToBlock(state, "p1", "a", "nope")).toBe(state);
    expect(assignSongToBlock(state, "p1", "zzz", "b-louvor")).toBe(state);
  });

  it("reordering blocks reorders their songs", () => {
    let state = withBlocks();
    state = assignSongToBlock(state, "p1", "a", "b-louvor");
    state = assignSongToBlock(state, "p1", "b", "b-ceia");
    state = moveBlockInPlaylist(state, "p1", "b-ceia", -1);
    expect(state[0]?.blocks?.map((block) => block.id)).toEqual([
      "b-ceia",
      "b-louvor",
    ]);
    expect(state[0]?.songIds).toEqual(["c", "d", "b", "a"]);
    expect(moveBlockInPlaylist(state, "p1", "b-ceia", -1)).toBe(state);
  });

  it("removing a block keeps its songs, now without block", () => {
    let state = assignSongToBlock(withBlocks(), "p1", "a", "b-louvor");
    state = removeBlockFromPlaylist(state, "p1", "b-louvor");
    expect(state[0]?.blocks?.map((block) => block.id)).toEqual(["b-ceia"]);
    expect(state[0]?.blockBySong).toEqual({});
    expect([...(state[0]?.songIds ?? [])].sort()).toEqual(["a", "b", "c", "d"]);
  });

  it("moves a song only inside its own block", () => {
    let state = withBlocks();
    state = assignSongToBlock(state, "p1", "a", "b-louvor");
    state = assignSongToBlock(state, "p1", "b", "b-louvor");
    expect(state[0]?.songIds).toEqual(["c", "d", "a", "b"]);
    expect(moveSongInPlaylist(state, "p1", "a", -1)).toBe(state);
    expect(moveSongInPlaylist(state, "p1", "a", 1)[0]?.songIds).toEqual([
      "c",
      "d",
      "b",
      "a",
    ]);
  });

  it("removing a song clears its block assignment", () => {
    let state = assignSongToBlock(withBlocks(), "p1", "a", "b-louvor");
    state = removeSongFromPlaylist(state, "p1", "a");
    expect(state[0]?.blockBySong).toEqual({});
    expect(state[0]?.songIds).not.toContain("a");
  });

  it("a song added later stays after the other unassigned songs, before blocks", () => {
    let state = assignSongToBlock(withBlocks(), "p1", "a", "b-louvor");
    state = addSongToPlaylist(state, "p1", "e");
    expect(state[0]?.songIds).toEqual(["b", "c", "d", "e", "a"]);
  });

  it("groups songs by block, unassigned first, keeping empty blocks", () => {
    const state = assignSongToBlock(withBlocks(), "p1", "a", "b-louvor");
    const groups = groupPlaylist(state[0] as Playlist);
    expect(
      groups.map((group) => [group.block?.name ?? null, group.songIds]),
    ).toEqual([
      [null, ["b", "c", "d"]],
      ["Louvor", ["a"]],
      ["Ceia", []],
    ]);
  });

  it("omits the unassigned group when empty and works without blocks", () => {
    expect(
      groupPlaylist(base[0] as Playlist).map((group) => group.songIds),
    ).toEqual([["a", "b", "c", "d"]]);
    const all = withBlocks();
    let state = all;
    for (const id of ["a", "b", "c", "d"])
      state = assignSongToBlock(state, "p1", id, "b-ceia");
    expect(groupPlaylist(state[0] as Playlist)[0]?.block?.id).toBe("b-louvor");
  });

  it("normalizes stale data: unknown blocks, missing songs and wrong order", () => {
    const dirty: Playlist = {
      id: "p1",
      name: "x",
      songIds: ["a", "b", "c"],
      blocks: [{ id: "b1", name: "Um" }],
      blockBySong: { a: "b1", b: "gone", zzz: "b1" },
    };
    expect(normalizePlaylist(dirty)).toEqual({
      id: "p1",
      name: "x",
      songIds: ["b", "c", "a"],
      blocks: [{ id: "b1", name: "Um" }],
      blockBySong: { a: "b1" },
    });
  });

  it("keeps playlists without blocks untouched", () => {
    expect(normalizePlaylist(base[0] as Playlist)).toBe(base[0]);
  });
});
