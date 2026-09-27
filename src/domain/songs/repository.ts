import type { Song, SongMedia, SongMediaKind, SongMediaRef } from "./types";

export const SONGS_STORAGE_KEY = "cifrases:songs:v1";
export const LIBRARY_STORAGE_KEY = "cifrases:library:v1";
export const MEDIA_STORAGE_PREFIX = "cifrases:media:v1";

export type PlayerPreferences = {
  fontScale: number;
  lineSpacing: number;
  maxWidth: "narrow" | "comfortable" | "wide";
  highContrast: boolean;
  autoScroll: boolean;
};

export const defaultPlayerPreferences: PlayerPreferences = {
  fontScale: 1,
  lineSpacing: 1.75,
  maxWidth: "comfortable",
  highContrast: false,
  autoScroll: true,
};

export type LibraryState = {
  favorites: string[];
  recent: string[];
  playlists: Array<{
    id: string;
    name: string;
    songIds: string[];
  }>;
  theme: "purple" | "gold" | "blue";
  playerPreferences: PlayerPreferences;
};

const defaultLibraryState: LibraryState = {
  favorites: [],
  recent: [],
  playlists: [],
  theme: "gold",
  playerPreferences: defaultPlayerPreferences,
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
    const player = candidate.playerPreferences;
    const playerPreferences: PlayerPreferences = {
      fontScale: typeof player?.fontScale === "number" ? Math.min(1.6, Math.max(0.8, player.fontScale)) : defaultPlayerPreferences.fontScale,
      lineSpacing: typeof player?.lineSpacing === "number" ? Math.min(2.4, Math.max(1.2, player.lineSpacing)) : defaultPlayerPreferences.lineSpacing,
      maxWidth: player?.maxWidth === "narrow" || player?.maxWidth === "wide" ? player.maxWidth : defaultPlayerPreferences.maxWidth,
      highContrast: player?.highContrast === true,
      autoScroll: player?.autoScroll !== false,
    };
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
      playerPreferences,
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

export function buildMediaStoragePath(songId: string, kind: SongMediaKind, mediaId: string): string {
  return `${MEDIA_STORAGE_PREFIX}/${songId}/${kind}/${mediaId}`;
}

export function createMediaRef(params: {
  songId: string;
  kind: SongMediaKind;
  path: string;
  mimeType: string;
  size: number;
  id?: string;
}): SongMediaRef {
  return {
    id: params.id ?? globalThis.crypto?.randomUUID?.() ?? `media-${Date.now()}`,
    kind: params.kind,
    path: params.path,
    mimeType: params.mimeType,
    size: params.size,
  };
}

export function resolveMediaUrl(media: SongMedia | undefined, kind: SongMediaKind = "audio"): string | undefined {
  const ref = media?.[kind];
  if (ref?.path) return ref.path;

  if (kind === "audio") return media?.audioUrl;
  if (kind === "cover") return media?.coverUrl;
  return media?.originalImageUrl;
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
