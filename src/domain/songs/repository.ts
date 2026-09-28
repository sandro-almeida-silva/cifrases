import type { Song, SongMedia, SongMediaKind, SongMediaRef } from "./types";

export const SONGS_STORAGE_KEY = "cifrases:songs:v1";
export const LIBRARY_STORAGE_KEY = "cifrases:library:v1";
export const MEDIA_STORAGE_PREFIX = "cifrases:media:v1";
export const EDITOR_AUTOSAVE_STORAGE_KEY = "cifrases:editor-autosave:v1";
export const ORIGINAL_IMPORT_DB_NAME = "cifrases-original-imports";
export const ORIGINAL_IMPORT_STORE = "files";
export const ORIGINAL_IMPORT_MAX_SIZE = 10 * 1024 * 1024;

export type OriginalImportValidation = {
  mimeType: "application/pdf" | "image/jpeg" | "image/png" | "image/webp";
  extension: "pdf" | "jpg" | "jpeg" | "png" | "webp";
};

function readFileBytes(file: File, length: number): Promise<Uint8Array> {
  return file.slice(0, length).arrayBuffer().then((buffer) => new Uint8Array(buffer));
}

function hasPrefix(bytes: Uint8Array, prefix: number[]): boolean {
  return prefix.every((value, index) => bytes[index] === value);
}

export async function validateOriginalImport(file: File): Promise<OriginalImportValidation> {
  if (file.size <= 0) throw new Error("O arquivo está vazio.");
  if (file.size > ORIGINAL_IMPORT_MAX_SIZE) throw new Error("O arquivo excede o limite de 10 MB.");

  const filename = file.name.trim();
  const extension = filename.toLowerCase().split(".").pop() ?? "";
  const allowedExtensions = new Set(["pdf", "jpg", "jpeg", "png", "webp"]);
  if (!allowedExtensions.has(extension)) {
    throw new Error("Formato não permitido. Use PDF, JPG, PNG ou WEBP.");
  }

  const bytes = await readFileBytes(file, 12);
  let mimeType: OriginalImportValidation["mimeType"] | null = null;

  if (hasPrefix(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) {
    mimeType = "application/pdf";
  } else if (hasPrefix(bytes, [0xff, 0xd8, 0xff])) {
    mimeType = "image/jpeg";
  } else if (hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    mimeType = "image/png";
  } else if (
    hasPrefix(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    mimeType = "image/webp";
  }

  if (!mimeType) throw new Error("O conteúdo do arquivo não corresponde a um formato suportado.");

  const extensionMatches =
    (mimeType === "application/pdf" && extension === "pdf") ||
    (mimeType === "image/jpeg" && (extension === "jpg" || extension === "jpeg")) ||
    (mimeType === "image/png" && extension === "png") ||
    (mimeType === "image/webp" && extension === "webp");

  if (!extensionMatches) {
    throw new Error("A extensão do arquivo não corresponde ao conteúdo identificado.");
  }

  return {
    mimeType,
    extension: extension as OriginalImportValidation["extension"],
  };
}

function openOriginalImportDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("O armazenamento local de arquivos não está disponível neste navegador."));
      return;
    }

    const request = window.indexedDB.open(ORIGINAL_IMPORT_DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(ORIGINAL_IMPORT_STORE)) {
        request.result.createObjectStore(ORIGINAL_IMPORT_STORE);
      }
    };
    request.onerror = () => reject(new Error("Não foi possível abrir o armazenamento local de arquivos."));
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
  });
}

export async function saveOriginalImport(file: File, validation: OriginalImportValidation): Promise<SongMediaRef> {
  const id = globalThis.crypto?.randomUUID?.() ?? `original-${Date.now()}`;
  const db = await openOriginalImportDb();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(ORIGINAL_IMPORT_STORE, "readwrite");
    transaction.objectStore(ORIGINAL_IMPORT_STORE).put(file, id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error("Não foi possível armazenar o arquivo original."));
    transaction.onabort = () => reject(new Error("O armazenamento do arquivo original foi interrompido."));
  }).finally(() => db.close());

  return {
    id,
    kind: "original",
    path: `indexeddb://${ORIGINAL_IMPORT_STORE}/${id}`,
    mimeType: validation.mimeType,
    size: file.size,
  };
}

export async function loadOriginalImport(id: string): Promise<Blob | null> {
  const db = await openOriginalImportDb();
  return new Promise<Blob | null>((resolve, reject) => {
    const transaction = db.transaction(ORIGINAL_IMPORT_STORE, "readonly");
    const request = transaction.objectStore(ORIGINAL_IMPORT_STORE).get(id);
    request.onsuccess = () => {
      const value = request.result;
      resolve(value instanceof Blob ? value : null);
    };
    request.onerror = () => reject(new Error("Não foi possível carregar o arquivo original."));
    transaction.oncomplete = () => db.close();
    transaction.onabort = () => {
      db.close();
      reject(new Error("A leitura do arquivo original foi interrompida."));
    };
  });
}

export async function deleteOriginalImport(id: string): Promise<void> {
  const db = await openOriginalImportDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(ORIGINAL_IMPORT_STORE, "readwrite");
    transaction.objectStore(ORIGINAL_IMPORT_STORE).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error("Não foi possível remover o arquivo original."));
    transaction.onabort = () => reject(new Error("A remoção do arquivo original foi interrompida."));
  }).finally(() => db.close());
}

export type EditorAutosave = {
  song: Song;
  mode: "create" | "edit";
  savedAt: string;
};

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


export function saveEditorAutosave(value: EditorAutosave): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(EDITOR_AUTOSAVE_STORAGE_KEY, JSON.stringify(value));
}

export function loadEditorAutosave(): EditorAutosave | null {
  if (typeof window === "undefined") return null;
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(EDITOR_AUTOSAVE_STORAGE_KEY) ?? "null");
    if (!value || typeof value !== "object") return null;
    const candidate = value as Partial<EditorAutosave>;
    if (!candidate.song || !isSong(candidate.song) || (candidate.mode !== "create" && candidate.mode !== "edit") || typeof candidate.savedAt !== "string") {
      return null;
    }
    return { song: candidate.song, mode: candidate.mode, savedAt: candidate.savedAt };
  } catch {
    return null;
  }
}

export function clearEditorAutosave(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(EDITOR_AUTOSAVE_STORAGE_KEY);
}
