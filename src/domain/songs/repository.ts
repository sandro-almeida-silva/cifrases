import type { Song } from "./types";

export const SONGS_STORAGE_KEY = "cifrases:songs:v1";
export const LIBRARY_STORAGE_KEY = "cifrases:library:v1";

export type LibraryState = {
  favorites: string[];
  recent: string[];
  playlists: Array<{
    id: string;
    name: string;
    songIds: string[];
  }>;
  theme: "purple" | "gold" | "blue";
};

const defaultLibraryState: LibraryState = {
  favorites: [],
  recent: [],
  playlists: [],
  theme: "purple",
};

export function parseSongs(value: string | null): Song[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(isSong) : [];
  } catch {
    return [];
  }
}

export function serializeSongs(songs: Song[]): string {
  return JSON.stringify(songs);
}

export function parseLibraryState(value: string | null): LibraryState {
  if (!value) return defaultLibraryState;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return defaultLibraryState;
    const candidate = parsed as Partial<LibraryState>;
    return {
      favorites: Array.isArray(candidate.favorites)
        ? candidate.favorites.filter((item): item is string => typeof item === "string")
        : [],
      recent: Array.isArray(candidate.recent)
        ? candidate.recent.filter((item): item is string => typeof item === "string")
        : [],
      playlists: Array.isArray(candidate.playlists)
        ? candidate.playlists.filter(
            (item): item is LibraryState["playlists"][number] =>
              Boolean(
                item &&
                  typeof item === "object" &&
                  typeof item.id === "string" &&
                  typeof item.name === "string" &&
                  Array.isArray(item.songIds),
              ),
          )
        : [],
      theme:
        candidate.theme === "gold" || candidate.theme === "blue"
          ? candidate.theme
          : "purple",
    };
  } catch {
    return defaultLibraryState;
  }
}

export function createSongId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `song-${Date.now()}`;
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function saveSongs(songs: Song[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SONGS_STORAGE_KEY, serializeSongs(songs));
}

export function loadSongs(): Song[] {
  if (typeof window === "undefined") return [];
  return parseSongs(window.localStorage.getItem(SONGS_STORAGE_KEY));
}

export function saveLibraryState(state: LibraryState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(state));
}

export function loadLibraryState(): LibraryState {
  if (typeof window === "undefined") return defaultLibraryState;
  return parseLibraryState(window.localStorage.getItem(LIBRARY_STORAGE_KEY));
}

export function isSong(value: unknown): value is Song {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Song>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.slug === "string" &&
    typeof candidate.title === "string" &&
    Array.isArray(candidate.sections)
  );
}

export function cloneSong(song: Song): Song {
  return JSON.parse(JSON.stringify(song)) as Song;
}
