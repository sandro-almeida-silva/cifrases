"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  AudioLines,
  ChevronLeft,
  ChevronRight,
  Heart,
  Library,
  Menu,
  Pause,
  Pencil,
  Play,
  Plus,
  Presentation,
  Save,
  Search,
  Settings2,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { Select } from "@/components/ui/select";
import {
  cloneSong,
  createSongId,
  defaultPlayerPreferences,
  deleteOriginalImport,
  loadEditorAutosave,
  loadOriginalImport,
  saveOriginalImport,
  validateOriginalImport,
  loadLibraryState,
  loadSongs,
  resolveMediaUrl,
  saveEditorAutosave,
  clearEditorAutosave,
  saveLibraryState,
  saveSongs,
  slugify,
  type LibraryState,
} from "@/domain/songs/repository";
import { resolveTimelineEvent } from "@/domain/songs/timeline";
import { transposeChord, transposeKey } from "@/domain/songs/transpose";
import type { ChordPlacement, Song, SongLine, SongSection, SongSectionType, SongTimelineEvent } from "@/domain/songs/types";

type View = "library" | "editor" | "detail" | "player" | "presentation" | "settings";
type SortMode = "title" | "artist" | "recent";

type DraftErrors = {
  title?: string;
  bpm?: string;
  sections?: string;
  [key: string]: string | undefined;
};

const sectionTypes: Array<{ value: SongSectionType; label: string }> = [
  { value: "intro", label: "Introdução" },
  { value: "verse", label: "Verso" },
  { value: "pre-chorus", label: "Pré-refrão" },
  { value: "chorus", label: "Refrão" },
  { value: "bridge", label: "Ponte" },
  { value: "instrumental", label: "Instrumental" },
  { value: "outro", label: "Final" },
];

const inputClass =
  "h-10 w-full rounded-xl border border-control-border bg-control-background px-3 text-sm text-foreground outline-none placeholder:text-control-placeholder focus:border-brand/50 focus:bg-control-background-hover";

function line(id: string): SongLine {
  return { id, text: "", chords: [] };
}

function emptySong(): Song {
  return {
    id: createSongId(),
    slug: "",
    title: "",
    sections: [
      {
        id: `section-${Date.now()}`,
        type: "verse",
        label: "Verso",
        lines: [line(`line-${Date.now()}`)],
      },
    ],
  };
}

function parseChords(value: string): ChordPlacement[] {
  return value
    .split(/[\s,;]+/)
    .filter(Boolean)
    .map((part) => {
      const [chord = "", position = "0"] = part.split("@");
      return { chord, position: Number.parseInt(position, 10) || 0 };
    });
}

function chordText(chords: ChordPlacement[] | undefined): string {
  return (chords ?? []).map((item) => `${item.chord}@${item.position}`).join(" ");
}

function sectionName(section: SongSection): string {
  return (
    section.label ??
    sectionTypes.find((item) => item.value === section.type)?.label ??
    "Seção"
  );
}

export default function HomePage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [libraryStatus, setLibraryStatus] = useState<"loading" | "ready" | "error">("loading");
  const [libraryError, setLibraryError] = useState("");
  const [library, setLibrary] = useState<LibraryState>({
    favorites: [],
    recent: [],
    playlists: [],
    theme: "gold",
    playerPreferences: defaultPlayerPreferences,
  });

  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(true);
  const [view, setView] = useState<View>("library");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Song | null>(null);
  const [draftOriginal, setDraftOriginal] = useState<Song | null>(null);
  const [draftMode, setDraftMode] = useState<"create" | "edit">("create");
  const [draftErrors, setDraftErrors] = useState<DraftErrors>({});
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("title");
  const [category, setCategory] = useState("all");
  const [transpose, setTranspose] = useState(0);
  const [playerPreferences, setPlayerPreferences] = useState(defaultPlayerPreferences);
  const [playing, setPlaying] = useState(false);
  const [currentSecond, setCurrentSecond] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioVolume, setAudioVolume] = useState(1);
  const [audioPlaybackRate, setAudioPlaybackRate] = useState(1);
  const [audioError, setAudioError] = useState(false);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const [autoScrollPaused, setAutoScrollPaused] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [timelineSynced, setTimelineSynced] = useState(false);
  const [presentationSection, setPresentationSection] = useState(0);
  const [theme, setTheme] = useState<LibraryState["theme"]>("purple");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [draftOriginalUrl, setDraftOriginalUrl] = useState<string | null>(null);
  const [draftOriginalName, setDraftOriginalName] = useState<string | null>(null);
  const [draftOriginalError, setDraftOriginalError] = useState("");
  const [ocrState, setOcrState] = useState<{
    status: "idle" | "running" | "error";
    progress: number;
    message: string;
  }>({ status: "idle", progress: 0, message: "" });
  const [editorAutosaveStatus, setEditorAutosaveStatus] = useState<"idle" | "saved" | "recovered">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const draftDirty = Boolean(draft && draftOriginal && JSON.stringify(draft) !== JSON.stringify(draftOriginal));

  useEffect(() => {
    if (!draft?.media?.original?.id) {
      setDraftOriginalUrl(null);
      setDraftOriginalName(null);
      setDraftOriginalError("");
      return;
    }

    let active = true;
    void loadOriginalImport(draft.media.original.id)
      .then((blob) => {
        if (!active || !blob) return;
        setDraftOriginalUrl(URL.createObjectURL(blob));
        setDraftOriginalName(draft.media?.original?.name ?? "arquivo original");
      })
      .catch(() => {
        if (active) setDraftOriginalError("Não foi possível carregar o arquivo original do rascunho.");
      });

    return () => {
      active = false;
    };
  }, [draft?.media?.original?.id]);

  useEffect(() => {
    return () => {
      if (draftOriginalUrl) URL.revokeObjectURL(draftOriginalUrl);
    };
  }, [draftOriginalUrl]);

  useEffect(() => {
    try {
      setLibraryStatus("loading");
      const stored = loadSongs();
      const storedLibrary = loadLibraryState();
      setSongs(stored);
      setLibrary(storedLibrary);
      setTheme(storedLibrary.theme);
      setPlayerPreferences(storedLibrary.playerPreferences);
      setLibraryStatus("ready");
    } catch {
      setSongs([]);
      setLibraryError("Não foi possível carregar sua biblioteca. Tente novamente.");
      setLibraryStatus("error");
    }
  }, []);

  useEffect(() => {
    if (songs.length > 0) saveSongs(songs);
  }, [songs]);

  useEffect(() => {
    if (libraryStatus !== "ready") return;
    saveLibraryState({ ...library, theme, playerPreferences });
  }, [library, theme, playerPreferences, libraryStatus]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (view !== "editor" || !draft || !draftDirty) return undefined;
    const timer = window.setTimeout(() => {
      saveEditorAutosave({ song: cloneSong(draft), mode: draftMode, savedAt: new Date().toISOString() });
      setEditorAutosaveStatus("saved");
    }, 700);
    return () => window.clearTimeout(timer);
  }, [draft, draftDirty, draftMode, view]);

  useEffect(() => {
    if (view !== "editor" || draft) return;
    const autosave = loadEditorAutosave();
    if (!autosave) return;
    setDraft(cloneSong(autosave.song));
    setDraftOriginal(cloneSong(autosave.song));
    setDraftMode(autosave.mode);
    setDraftErrors({});
    setEditorAutosaveStatus("recovered");
  }, [draft, view]);

  useEffect(() => {
    if (!draftDirty) return undefined;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [draftDirty]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  const song = songs.find((item) => item.id === selectedId) ?? null;

  const filteredSongs = useMemo(() => {
    const text = query.trim().toLowerCase();
    return [...songs]
      .filter((item) => {
        const haystack = `${item.title} ${item.artist ?? ""} ${item.category ?? ""}`.toLowerCase();
        return (!text || haystack.includes(text)) && (category === "all" || item.category === category);
      })
      .sort((a, b) => {
        if (sort === "artist") return (a.artist ?? "").localeCompare(b.artist ?? "");
        if (sort === "recent") return library.recent.indexOf(a.id) - library.recent.indexOf(b.id);
        return a.title.localeCompare(b.title);
      });
  }, [category, library.recent, query, sort, songs]);

  const categories = Array.from(
    new Set(songs.map((item) => item.category).filter((value): value is string => Boolean(value))),
  ).sort();

  function syncTimeline(seconds: number) {
    const result = resolveTimelineEvent(song?.timeline?.events ?? [], seconds);
    setActiveLineId(result.event?.lineId ?? null);
    setActiveSectionId(result.event?.sectionId ?? null);
    setTimelineSynced(result.synced);
  }

  useEffect(() => {
    if (!playing || !audioRef.current || !song?.timeline?.events.length) return undefined;

    const timer = window.setInterval(() => {
      const audio = audioRef.current;
      if (!audio) return;
      setCurrentSecond(audio.currentTime);
      syncTimeline(audio.currentTime);
    }, 120);

    return () => window.clearInterval(timer);
  }, [playing, song]);



  function openSong(id: string) {
    setMobileMenu(false);
    setSelectedId(id);
    setTranspose(0);
    setCurrentSecond(0);
    setActiveLineId(null);
    setAutoScrollPaused(false);
    setActiveSectionId(null);
    setTimelineSynced(false);
    setPresentationSection(0);
    setLibrary((state) => ({
      ...state,
      recent: [id, ...state.recent.filter((item) => item !== id)].slice(0, 20),
    }));
    setView("detail");
  }

  function duplicateSong(item: Song) {
    const copyBaseTitle = `${item.title} (cópia)`;
    const existingTitles = new Set(songs.map((songItem) => songItem.title));
    let title = copyBaseTitle;
    let suffix = 2;
    while (existingTitles.has(title)) {
      title = `${copyBaseTitle} ${suffix}`;
      suffix += 1;
    }

    const copy = {
      ...cloneSong(item),
      id: createSongId(),
      title,
      slug: slugify(title),
    };
    setSongs((state) => [copy, ...state]);
    setSelectedId(copy.id);
    setLibrary((state) => ({
      ...state,
      recent: [copy.id, ...state.recent.filter((id) => id !== copy.id)].slice(0, 20),
    }));
    setView("detail");
  }

  function startNew() {
    const next = emptySong();
    setDraftOriginalUrl(null);
    setDraftOriginalName(null);
    setDraftOriginalError("");
    setDraft(next);
    setDraftOriginal(cloneSong(next));
    setDraftMode("create");
    setDraftErrors({});
    setMobileMenu(false);
    setView("editor");
  }

  function startEdit(item: Song) {
    const next = cloneSong(item);
    setDraftOriginalError("");
    setDraft(next);
    setDraftOriginal(cloneSong(next));
    setDraftMode("edit");
    setDraftErrors({});
    setSelectedId(item.id);
    setMobileMenu(false);
    setView("editor");
  }

  function saveDraft() {
    if (!draft) return;
    const errors: DraftErrors = {};
    if (!draft.title.trim()) errors.title = "Informe o título da música.";
    if (draft.bpm !== undefined && (draft.bpm < 1 || draft.bpm > 300)) errors.bpm = "Informe um BPM entre 1 e 300.";
    if (draft.sections.length === 0) {
      errors.sections = "Adicione pelo menos uma seção.";
    }

    draft.sections.forEach((section) => {
      if (!section.label?.trim()) errors[`section-${section.id}`] = "Informe o nome da seção.";
      if (section.lines.length === 0) errors[`lines-${section.id}`] = "Adicione pelo menos uma linha.";
      section.lines.forEach((item, lineIndex) => {
        if (!item.text.trim() && !(item.chords?.length)) {
          errors[`line-${item.id}`] = `Informe a letra ou um acorde na linha ${lineIndex + 1}.`;
        }
      });
    });

    setDraftErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const generatedBaseSlug = slugify(draft.title);
    const existingSlugs = new Set(
      songs
        .filter((item) => item.id !== draft.id)
        .map((item) => item.slug),
    );

    let generatedSlug = generatedBaseSlug;
    let suffix = 2;
    while (existingSlugs.has(generatedSlug)) {
      generatedSlug = generatedBaseSlug ? `${generatedBaseSlug}-${suffix}` : `musica-${suffix}`;
      suffix += 1;
    }

    const next = { ...draft, title: draft.title.trim(), slug: generatedSlug };
    setSongs((state) => {
      const exists = state.some((item) => item.id === next.id);
      return exists ? state.map((item) => (item.id === next.id ? next : item)) : [next, ...state];
    });
    setSelectedId(next.id);
    clearEditorAutosave();
    setEditorAutosaveStatus("idle");
    setDraft(null);
    setDraftOriginal(null);
    setDraftMode("create");
    setDraftErrors({});
    setView("player");
  }

  useEffect(() => {
    if (view !== "editor" || !draft) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveDraft();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [draft, view]);

  function navigateFromEditor(nextView: View) {
    if (view === "editor" && draftDirty && !window.confirm("Existem alterações não salvas. Deseja descartar a edição?")) return;
    setView(nextView);
    setMobileMenu(false);
  }

  function deleteSong(id: string) {
    const item = songs.find((songItem) => songItem.id === id);
    if (!item || !window.confirm(`Excluir "${item.title}"?`)) return;
    if (item.media?.original?.id) {
      void deleteOriginalImport(item.media.original.id).catch(() => undefined);
    }
    setSongs((state) => state.filter((songItem) => songItem.id !== id));
    setLibrary((state) => ({
      ...state,
      favorites: state.favorites.filter((itemId) => itemId !== id),
      recent: state.recent.filter((itemId) => itemId !== id),
      playlists: state.playlists.map((playlist) => ({
        ...playlist,
        songIds: playlist.songIds.filter((itemId) => itemId !== id),
      })),
    }));
    setSelectedId(null);
    setView("library");
  }

  function moveLine(sectionId: string, lineId: string, direction: -1 | 1) {
    updateDraft((current) => ({
      ...current,
      sections: current.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const index = section.lines.findIndex((item) => item.id === lineId);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= section.lines.length) return section;
        const lines = [...section.lines];
        const currentLine = lines[index];
        const nextLine = lines[target];
        if (!currentLine || !nextLine) return section;
        lines[index] = nextLine;
        lines[target] = currentLine;
        return { ...section, lines };
      }),
    }));
  }

  function updateDraft(updater: (current: Song) => Song) {
    setDraft((current) => (current ? updater(current) : current));
  }

  function addSection() {
    updateDraft((current) => ({
      ...current,
      sections: [
        ...current.sections,
        {
          id: `section-${Date.now()}`,
          type: "verse",
          label: "Verso",
          lines: [line(`line-${Date.now()}`)],
        },
      ],
    }));
  }

  function addLine(sectionId: string) {
    updateDraft((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === sectionId
          ? { ...section, lines: [...section.lines, line(`line-${Date.now()}`)] }
          : section,
      ),
    }));
  }

  function moveSection(sectionId: string, direction: -1 | 1) {
    updateDraft((current) => {
      const index = current.sections.findIndex((section) => section.id === sectionId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.sections.length) return current;
      const sections = [...current.sections];
      const currentSection = sections[index];
      const targetSection = sections[target];
      if (!currentSection || !targetSection) return current;
      sections[index] = targetSection;
      sections[target] = currentSection;
      return { ...current, sections };
    });
  }

  function removeSection(sectionId: string) {
    updateDraft((current) => {
      if (current.sections.length <= 1) return current;
      return { ...current, sections: current.sections.filter((section) => section.id !== sectionId) };
    });
  }

  function removeLine(sectionId: string, lineId: string) {
    updateDraft((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === sectionId
          ? { ...section, lines: section.lines.filter((item) => item.id !== lineId) }
          : section,
      ),
    }));
  }

  async function extractOcr() {
    if (!draft?.media?.original?.id || ocrState.status === "running") return;

    setOcrState({ status: "running", progress: 0, message: "Preparando OCR..." });
    try {
      const original = await loadOriginalImport(draft.media.original.id);
      if (!original) throw new Error("O arquivo original do rascunho não está disponível.");
      const { extractSongFromOriginal } = await import("@/domain/songs/ocr");
      const result = await extractSongFromOriginal(original, draft.media.original.mimeType, (progress) => {
        setOcrState({
          status: "running",
          progress: progress.progress,
          message: progress.stage === "recognizing" ? "Reconhecendo texto..." : progress.stage === "finalizing" ? "Organizando estrutura..." : "Preparando OCR...",
        });
      });

      updateDraft((current) => ({
        ...current,
        sections: result.sections,
        ocr: {
          confidence: result.confidence,
          lowConfidenceCount: result.lowConfidenceCount,
          processedAt: new Date().toISOString(),
          source: result.source,
        },
      }));
      setOcrState({
        status: "idle",
        progress: 100,
        message: result.lowConfidenceCount
          ? `OCR concluído com ${result.lowConfidenceCount} linha(s) de baixa confiança. Revise antes de salvar.`
          : "OCR concluído. Revise a estrutura antes de salvar.",
      });
    } catch (error: unknown) {
      setOcrState({
        status: "error",
        progress: 0,
        message: error instanceof Error ? error.message : "Não foi possível executar o OCR.",
      });
    }
  }

  function cancelDraft() {
    if (draftDirty && !window.confirm("Existem alterações não salvas. Deseja descartar a edição?")) return;
    if (draftMode === "create" && draft?.media?.original?.id) {
      void deleteOriginalImport(draft.media.original.id).catch(() => undefined);
    }
    clearEditorAutosave();
    setEditorAutosaveStatus("idle");
    setDraft(null);
    setDraftOriginal(null);
    setDraftMode("create");
    setDraftErrors({});
    setOcrState({ status: "idle", progress: 0, message: "" });
    setView(song ? "player" : "library");
  }

  function attachAudio(file: File) {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result !== "string") return;
      updateDraft((current) => ({
        ...current,
        media: { ...current.media, audioUrl: reader.result as string },
      }));
    });
    reader.readAsDataURL(file);
  }

  function buildTimeline() {
    updateDraft((current) => {
      let index = 0;
      const events = current.sections.flatMap((section) =>
        section.lines.map((item) => ({
          atMs: index++ * 15000,
          sectionId: section.id,
          lineId: item.id,
          chord: item.chords?.[0]?.chord,
        })),
      );
      return { ...current, timeline: { bpm: current.bpm, events } };
    });
  }

  function toggleFavorite(id: string) {
    setLibrary((state) => ({
      ...state,
      favorites: state.favorites.includes(id)
        ? state.favorites.filter((item) => item !== id)
        : [id, ...state.favorites],
    }));
  }

  function importJson(file: File) {
    void file
      .text()
      .then((text) => {
        const parsed: unknown = JSON.parse(text);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        const valid = list.filter((item): item is Song => Boolean(
          item && typeof item === "object" &&
          typeof (item as Partial<Song>).id === "string" &&
          typeof (item as Partial<Song>).title === "string" &&
          Array.isArray((item as Partial<Song>).sections),
        ));
        if (!valid.length) throw new Error("Nenhuma música válida encontrada.");
        setSongs((state) => {
          const map = new Map(state.map((item) => [item.id, item]));
          valid.forEach((item) => {
            map.set(item.id, item);
          });
          return [...map.values()];
        });
        setImportMessage(`${valid.length} música(s) importada(s).`);
      })
      .catch((error: unknown) => {
        setImportMessage(error instanceof Error ? error.message : "Falha na importação.");
      });
  }

  async function importOriginalFile(file: File) {
    setImportMessage("");
    setDraftOriginalError("");

    try {
      const validation = await validateOriginalImport(file);
      const mediaRef = await saveOriginalImport(file, validation);
      const next = emptySong();
      const titleFromFilename = file.name.replace(/\.[^.]+$/, "").trim().slice(0, 120);

      next.title = titleFromFilename;
      next.media = { ...next.media, original: mediaRef };

      setDraft(next);
      setDraftOriginal(cloneSong(next));
      setDraftMode("create");
      saveEditorAutosave({ song: cloneSong(next), mode: "create", savedAt: new Date().toISOString() });
      setDraftErrors({});
      setDraftOriginalName(file.name.slice(0, 120));
      setDraftOriginalUrl(URL.createObjectURL(file));
      setEditorAutosaveStatus("idle");
      setSelectedId(next.id);
      setView("editor");
      setImportMessage("Arquivo importado como rascunho. Revise o conteúdo antes de salvar.");
    } catch (error: unknown) {
      setImportMessage(error instanceof Error ? error.message : "Falha ao importar o arquivo.");
    }
  }


  function exportJson() {
    const blob = new Blob([JSON.stringify(songs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "cifrases-musicas.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function updatePlayerPreferences(patch: Partial<typeof defaultPlayerPreferences>) {
    setPlayerPreferences((current) => ({ ...current, ...patch }));
  }

  function resetPlayerPreferences() {
    setPlayerPreferences(defaultPlayerPreferences);
  }

  function toggleAudio() {
    const audio = audioRef.current;
    if (!audio || !song?.media?.audioUrl) return;
    if (audio.paused) {
      void audio.play().then(() => setPlaying(true)).catch(() => setAudioError(true));
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  function handleAudioLoaded() {
    const audio = audioRef.current;
    if (!audio) return;
    setAudioError(false);
    setAudioDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    audio.volume = audioVolume;
    audio.playbackRate = audioPlaybackRate;
    const stored = Number(window.sessionStorage.getItem(`cifrases:audio-position:${audio.getAttribute("data-song-id")}`) ?? 0);
    if (stored > 0 && stored < audio.duration) {
      audio.currentTime = stored;
      setCurrentSecond(stored);
    }
  }

  function handleAudioTime(seconds: number) {
    setCurrentSecond(seconds);
    syncTimeline(seconds);
    const songId = audioRef.current?.getAttribute("data-song-id");
    if (songId) window.sessionStorage.setItem(`cifrases:audio-position:${songId}`, String(seconds));
  }

  function seekAudio(seconds: number) {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    audio.currentTime = Math.min(audio.duration, Math.max(0, seconds));
    setCurrentSecond(audio.currentTime);
    setAutoScrollPaused(false);
  }

  function setAudioVolumeValue(value: number) {
    const audio = audioRef.current;
    if (audio) audio.volume = value;
    setAudioVolume(value);
  }

  function setAudioPlaybackRateValue(value: number) {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = value;
    setAudioPlaybackRate(value);
  }

  function resetAudioSessionPosition() {
    const songId = audioRef.current?.getAttribute("data-song-id");
    if (songId) window.sessionStorage.removeItem(`cifrases:audio-position:${songId}`);
    seekAudio(0);
  }

  const content = (
    <>
      {view === "library" ? (
        <LibraryView
          songs={filteredSongs}
          totalSongs={songs.length}
          status={libraryStatus}
          error={libraryError}
          categories={categories}
          category={category}
          sort={sort}
          favorites={library.favorites}
          onSearch={setQuery}
          onCategory={setCategory}
          onSort={setSort}
          onOpen={openSong}
          onEdit={startEdit}
          onDelete={deleteSong}
          onFavorite={toggleFavorite}
          onNew={startNew}
          onImportOriginal={importOriginalFile}
          importMessage={importMessage}
        />
      ) : null}

      {view === "editor" && draft ? (
        <EditorView
          song={draft}
          setSong={setDraft}
          onSave={saveDraft}
          onCancel={cancelDraft}
          dirty={draftDirty}
          mode={draftMode}
          errors={draftErrors}
          onAddSection={addSection}
          onAddLine={addLine}
          onMoveSection={moveSection}
          onRemoveSection={removeSection}
          onRemoveLine={removeLine}
          onMoveLine={moveLine}
          onAttachAudio={attachAudio}
          originalPreviewUrl={draftOriginalUrl}
          originalFileName={draftOriginalName}
          originalError={draftOriginalError}
          ocrState={ocrState}
          onExtractOcr={extractOcr}
          onBuildTimeline={buildTimeline}
          autosaveStatus={editorAutosaveStatus}
          onTimelineUpdate={(patch) => updateDraft((current) => ({ ...current, timeline: { ...(current.timeline ?? { events: [] }), ...patch } }))}
        />
      ) : null}

      {view === "detail" ? (
        <DetailView
          song={song}
          onBack={() => navigateFromEditor("library")}
          onPlay={() => song && setView("player")}
          onEdit={() => song && startEdit(song)}
          onDuplicate={() => song && duplicateSong(song)}
          onDelete={() => song && deleteSong(song.id)}
          onPresentation={() => song && setView("presentation")}
        />
      ) : null}

      {view === "player" ? (
        <PlayerView
          song={song}
          transpose={transpose}
          preferences={playerPreferences}
          activeLineId={activeLineId}
          autoScrollPaused={autoScrollPaused}
          onToggleAutoScrollPaused={() => setAutoScrollPaused((paused) => !paused)}
          activeSectionId={activeSectionId}
          timelineSynced={timelineSynced}
          currentSecond={currentSecond}
          playing={playing}
          audioRef={audioRef}
          onBack={() => setView("detail")}
          onEdit={() => song && startEdit(song)}
          onTranspose={setTranspose}
          onPreferences={updatePlayerPreferences}
          onResetPreferences={resetPlayerPreferences}
          onToggleAudio={toggleAudio}
          onTime={handleAudioTime}
          audioDuration={audioDuration}
          audioVolume={audioVolume}
          audioPlaybackRate={audioPlaybackRate}
          audioError={audioError}
          onAudioLoaded={handleAudioLoaded}
          onAudioError={() => { setAudioError(true); setPlaying(false); }}
          onAudioEnded={() => setPlaying(false)}
          onSeek={seekAudio}
          onVolume={setAudioVolumeValue}
          onPlaybackRate={setAudioPlaybackRateValue}
          onResetAudioPosition={resetAudioSessionPosition}
          favorite={song ? library.favorites.includes(song.id) : false}
          onFavorite={() => song && toggleFavorite(song.id)}
        />
      ) : null}

      {view === "presentation" ? (
        <PresentationView
          song={song}
          index={presentationSection}
          onIndex={setPresentationSection}
          onBack={() => setView("player")}
        />
      ) : null}

      {view === "settings" ? (
        <SettingsView
          theme={theme}
          songs={songs}
          onTheme={setTheme}
          onImport={importJson}
          onExport={exportJson}
          message={importMessage}
        />
      ) : null}
    </>
  );

  return (
    <main className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside
          className={[
            "fixed inset-y-0 left-0 z-40 border-r border-white/10 bg-surface transition-[width,transform,padding] duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:overflow-visible",
            desktopSidebarCollapsed ? "lg:w-20 lg:p-3" : "lg:w-72 lg:p-5",
            "w-72 p-5",
            mobileMenu ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <div className="relative flex items-center justify-between">
            <Logo compact={desktopSidebarCollapsed} />
            <button type="button" className="lg:hidden rounded-xl p-2 text-muted hover:bg-white/5" onClick={() => setMobileMenu(false)} aria-label="Fechar menu">
              <X size={18} />
            </button>
            <button
              type="button"
              className="absolute -right-7 top-1/2 hidden size-7 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-panel text-muted shadow-lg shadow-black/20 transition hover:border-white/20 hover:text-foreground lg:grid"
              onClick={() => setDesktopSidebarCollapsed((value) => !value)}
              aria-label={desktopSidebarCollapsed ? "Expandir menu" : "Recolher menu"}
              title={desktopSidebarCollapsed ? "Expandir menu" : "Recolher menu"}
            >
              {desktopSidebarCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>
          </div>

          <button
            type="button"
            className={[
              "mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition hover:brightness-105",
              desktopSidebarCollapsed ? "lg:size-11 lg:rounded-2xl lg:p-0" : "",
            ].join(" ")}
            onClick={startNew}
            aria-label="Nova música"
            title={desktopSidebarCollapsed ? "Nova música" : undefined}
          >
            <Plus size={18} />
            <span className={desktopSidebarCollapsed ? "hidden" : "lg:inline"}>Nova música</span>
          </button>

          <nav className="mt-7 space-y-1" aria-label="Navegação principal">
            <NavButton icon={<Library size={17} />} label="Biblioteca" active={view === "library"} collapsed={desktopSidebarCollapsed} onClick={() => navigateFromEditor("library")} />
            <NavButton
              icon={<PencilIcon />}
              label="Editor"
              active={view === "editor"}
              collapsed={desktopSidebarCollapsed}
              onClick={() => {
                if (view === "editor" && draftDirty && !window.confirm("Existem alterações não salvas. Deseja descartar a edição?")) return;
                startEdit(song ?? songs[0] ?? emptySong());
              }}
            />
            <NavButton icon={<Presentation size={17} />} label="Apresentação" active={view === "presentation"} collapsed={desktopSidebarCollapsed} onClick={() => navigateFromEditor("presentation")} />
            <NavButton icon={<Settings2 size={17} />} label="Configurações" active={view === "settings"} collapsed={desktopSidebarCollapsed} onClick={() => navigateFromEditor("settings")} />
          </nav>
        </aside>

        {mobileMenu ? (
          <button type="button" className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMobileMenu(false)} aria-label="Fechar navegação" />
        ) : null}

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-background/90 backdrop-blur-xl">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
              <button type="button" className="rounded-xl border border-white/10 p-2 lg:hidden" onClick={() => setMobileMenu(true)} aria-label="Abrir menu">
                <Menu size={18} />
              </button>
              <div className="flex-1">
                {view === "library" ? (
                  <div className="flex max-w-xl items-center gap-2 rounded-xl border border-control-border bg-control-background px-3">
                    <Search size={16} className="text-muted" />
                    <input className="h-10 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-control-placeholder" placeholder="Buscar música..." aria-label="Buscar música" value={query} onChange={(event) => setQuery(event.target.value)} />
                  </div>
                ) : (
                  <span className="text-sm font-semibold">{view === "editor" ? draft?.title || "Nova música" : song?.title || "Cifrases"}</span>
                )}
              </div>
              <span className="hidden text-xs text-muted sm:block">{songs.length} músicas</span>
            </div>
          </header>

          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
            {content}
          </div>
        </div>
      </div>
    </main>
  );
}

function PencilIcon() {
  return <Pencil size={17} />;
}

function NavButton({
  icon,
  label,
  active,
  collapsed,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`group relative flex w-full items-center rounded-xl py-2.5 text-sm transition ${
        collapsed ? "justify-center lg:px-0" : "gap-3 px-3"
      } ${active ? "bg-brand/12 text-brand-soft" : "text-muted hover:bg-white/5 hover:text-foreground"}`}
      onClick={onClick}
      title={collapsed ? label : undefined}
    >
      {icon}
      <span className={collapsed ? "hidden" : "lg:inline"}>{label}</span>
      {collapsed ? (
        <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-lg border border-white/10 bg-panel px-2.5 py-1.5 text-xs font-medium text-foreground opacity-0 shadow-xl transition-opacity group-hover:opacity-100 lg:block">
          {label}
        </span>
      ) : null}
    </button>
  );
}

function LibraryView({
  songs,
  totalSongs,
  status,
  error,
  categories,
  category,
  sort,
  favorites,
  onCategory,
  onSort,
  onOpen,
  onEdit,
  onDelete,
  onFavorite,
  onNew,
  onImportOriginal,
  importMessage,
}: {
  songs: Song[];
  totalSongs: number;
  status: "loading" | "ready" | "error";
  error: string;
  categories: string[];
  category: string;
  sort: SortMode;
  favorites: string[];
  onSearch: (value: string) => void;
  onCategory: (value: string) => void;
  onSort: (value: SortMode) => void;
  onOpen: (id: string) => void;
  onEdit: (song: Song) => void;
  onDelete: (id: string) => void;
  onFavorite: (id: string) => void;
  onNew: () => void;
  onImportOriginal: (file: File) => void;
  importMessage: string;
}) {
  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-soft">Biblioteca</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Suas músicas</h1>
          <p className="mt-2 text-sm text-muted">Cadastre, encontre e toque suas músicas.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="rounded-xl border border-control-border px-3 py-2 text-sm text-foreground hover:bg-control-background-hover" onClick={onNew}>Nova</button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm">
            <Upload size={15} /> Importar cifra
            <input className="hidden" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImportOriginal(file);
              event.currentTarget.value = "";
            }} />
          </label>
        </div>
      </div>
      {importMessage ? <p className="mt-3 text-xs text-muted" role="status">{importMessage}</p> : null}

      <div className="mt-6 flex flex-wrap gap-2">
        <Select
          value={category}
          options={[
            { value: "all", label: "Todas" },
            ...categories.map((item) => ({ value: item, label: item })),
          ]}
          onChange={onCategory}
          ariaLabel="Filtrar por categoria"
          className="min-w-48"
        />
        <Select
          value={sort}
          options={[
            { value: "title", label: "Título" },
            { value: "artist", label: "Artista" },
            { value: "recent", label: "Recentes" },
          ]}
          onChange={onSort}
          ariaLabel="Ordenar músicas"
          className="min-w-48"
        />
      </div>

      {status === "loading" ? (
        <div role="status" className="mt-8 rounded-3xl border border-white/10 bg-surface p-10 text-center text-muted">
          Carregando sua biblioteca...
        </div>
      ) : status === "error" ? (
        <div role="alert" className="mt-8 rounded-3xl border border-red-400/20 bg-red-400/5 p-10 text-center">
          <h2 className="font-bold">Não foi possível carregar a biblioteca</h2>
          <p className="mt-2 text-sm text-muted">{error}</p>
        </div>
      ) : totalSongs === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-white/15 p-10 text-center">
          <Library className="mx-auto text-brand-soft" size={30} />
          <h2 className="mt-3 font-bold">Sua biblioteca está vazia</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">Cadastre sua primeira música para começar a organizar seu repertório.</p>
          <button type="button" className="mt-5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white" onClick={onNew}>Cadastrar primeira música</button>
        </div>
      ) : songs.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-white/15 p-10 text-center">
          <Library className="mx-auto text-brand-soft" size={30} />
          <h2 className="mt-3 font-bold">Nenhuma música encontrada</h2>
          <p className="mt-2 text-sm text-muted">Ajuste a busca ou os filtros para encontrar uma música.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          {songs.map((item) => (
            <article key={item.id} className="rounded-2xl border border-white/10 bg-surface p-4">
              <div className="flex gap-4">
                <button type="button" className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand text-white" onClick={() => onOpen(item.id)} aria-label={`Abrir ${item.title}`}>
                  <Play size={20} fill="currentColor" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <button type="button" className="text-left font-bold hover:text-brand-soft" onClick={() => onOpen(item.id)}>{item.title}</button>
                      <p className="mt-1 text-sm text-muted">{item.artist || "Artista não informado"}</p>
                    </div>
                    <button type="button" className="rounded-lg p-2 text-muted hover:text-chord" onClick={() => onFavorite(item.id)} aria-label="Favoritar">
                      <Heart size={16} fill={favorites.includes(item.id) ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                    {item.key ? <span className="rounded-full bg-chord/10 px-2 py-1 text-chord">{item.key}</span> : null}
                    {item.category ? <span className="rounded-full bg-white/5 px-2 py-1 text-muted">{item.category}</span> : null}
                    <span className="rounded-full bg-white/5 px-2 py-1 text-muted">{item.sections.length} seções</span>
                    {item.media?.audioUrl ? <span className="rounded-full bg-brand/10 px-2 py-1 text-brand-soft">áudio</span> : null}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-1 border-t border-white/8 pt-3">
                <button type="button" className="rounded-lg p-2 text-muted hover:bg-white/5" onClick={() => onEdit(item)} aria-label="Editar"><Pencil size={15} /></button>
                <button type="button" className="rounded-lg p-2 text-muted hover:bg-red-500/10 hover:text-red-200" onClick={() => onDelete(item.id)} aria-label="Excluir"><Trash2 size={15} /></button>
                <button type="button" className="rounded-lg p-2 text-brand-soft hover:bg-brand/10" onClick={() => onOpen(item.id)} aria-label="Tocar"><ArrowRight size={16} /></button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function EditorView({
  song,
  setSong,
  dirty,
  mode,
  errors,
  onSave,
  onCancel,
  onAddSection,
  onAddLine,
  onMoveSection,
  onRemoveSection,
  onRemoveLine,
  onMoveLine,
  onAttachAudio,
  originalPreviewUrl,
  originalFileName,
  originalError,
  ocrState,
  onExtractOcr,
  onBuildTimeline,
  autosaveStatus,
  onTimelineUpdate,
}: {
  song: Song;
  setSong: (song: Song | null) => void;
  dirty: boolean;
  mode: "create" | "edit";
  errors: DraftErrors;
  onSave: () => void;
  onCancel: () => void;
  onAddSection: () => void;
  onAddLine: (sectionId: string) => void;
  onMoveSection: (sectionId: string, direction: -1 | 1) => void;
  onRemoveSection: (sectionId: string) => void;
  onRemoveLine: (sectionId: string, lineId: string) => void;
  onMoveLine: (sectionId: string, lineId: string, direction: -1 | 1) => void;
  onAttachAudio: (file: File) => void;
  originalPreviewUrl: string | null;
  originalFileName: string | null;
  originalError: string;
  ocrState: { status: "idle" | "running" | "error"; progress: number; message: string };
  onExtractOcr: () => void;
  onBuildTimeline: () => void;
  autosaveStatus: "idle" | "saved" | "recovered";
  onTimelineUpdate: (patch: Partial<Song["timeline"]>) => void;
}) {
  function changeSection(sectionId: string, updater: (section: SongSection) => SongSection) {
    setSong({
      ...song,
      sections: song.sections.map((section) =>
        section.id === sectionId ? updater(section) : section,
      ),
    });
  }

  function changeLine(sectionId: string, lineId: string, updater: (item: SongLine) => SongLine) {
    changeSection(sectionId, (section) => ({
      ...section,
      lines: section.lines.map((item) => (item.id === lineId ? updater(item) : item)),
    }));
  }

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-soft">Editor</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">{mode === "edit" ? "Editar música" : "Cadastrar música"}</h1>
          <p className="mt-2 text-sm text-muted">Preencha os dados e monte a estrutura da música antes de salvar.</p>
          <p className="mt-2 text-xs text-muted" role="status">{autosaveStatus === "saved" ? "Rascunho salvo localmente." : autosaveStatus === "recovered" ? "Rascunho recuperado do armazenamento local." : "Autosave local ativo durante a edição."}</p>
          {dirty ? <span className="mt-2 inline-flex rounded-full bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-200">Alterações não salvas</span> : null}
        </div>
        <div className="flex gap-2">
          <button type="button" className="rounded-xl border border-white/10 px-3 py-2 text-sm" onClick={onCancel}>Cancelar</button>
          <button type="button" className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white" onClick={onSave}><Save size={15} /> Salvar</button>
        </div>
      </div>

      {song.media?.original ? (
        <OriginalImportPreview
          url={originalPreviewUrl}
          fileName={originalFileName}
          mimeType={song.media.original.mimeType}
          size={song.media.original.size}
          error={originalError}
        />
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          ["Título", song.title, (value: string) => setSong({ ...song, title: value }), "title"],
          ["Artista", song.artist ?? "", (value: string) => setSong({ ...song, artist: value }), "artist"],
          ["Categoria", song.category ?? "", (value: string) => setSong({ ...song, category: value }), "category"],
          ["Tonalidade", song.key ?? "", (value: string) => setSong({ ...song, key: value.toUpperCase() }), "key"],
          ["BPM", String(song.bpm ?? ""), (value: string) => setSong({ ...song, bpm: value ? Number(value) : undefined }), "bpm"],
        ].map(([label, value, update, field]) => (
          <label key={field as string}>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label as string}</span>
            <input
              className={`${inputClass} ${errors[field as string] ? "border-red-400/60" : ""}`}
              value={value as string}
              type={field === "bpm" ? "number" : "text"}
              min={field === "bpm" ? 1 : undefined}
              max={field === "bpm" ? 300 : undefined}
              onChange={(event) => (update as (value: string) => void)(event.target.value)}
              aria-invalid={Boolean(errors[field as string])}
              aria-describedby={errors[field as string] ? `${field}-error` : undefined}
            />
            {errors[field as string] ? <span id={`${field}-error`} className="mt-1 block text-xs text-red-300">{errors[field as string]}</span> : null}
          </label>
        ))}
      </div>

      {errors.sections ? <p className="mt-4 text-sm text-red-300">{errors.sections}</p> : null}

      {song.media?.original ? (
        <div className="mt-5 rounded-2xl border border-brand/20 bg-brand/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Extração inteligente</p>
              <p className="mt-1 text-xs text-muted">Reconhece o texto localmente e organiza seções e linhas para revisão.</p>
            </div>
            <button
              type="button"
              className="rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              onClick={onExtractOcr}
              disabled={ocrState.status === "running"}
            >
              {ocrState.status === "running" ? "Processando..." : "Extrair com OCR"}
            </button>
          </div>
          {ocrState.status === "running" ? (
            <div className="mt-4">
              <div className="mb-2 flex justify-between text-xs text-muted">
                <span>{ocrState.message}</span><span>{ocrState.progress}%</span>
              </div>
              <progress className="h-2 w-full" value={ocrState.progress} max={100} aria-label="Progresso do OCR" />
            </div>
          ) : null}
          {ocrState.message && ocrState.status !== "running" ? (
            <p className={`mt-3 text-xs ${ocrState.status === "error" ? "text-red-300" : "text-amber-200"}`} role={ocrState.status === "error" ? "alert" : "status"}>{ocrState.message}</p>
          ) : null}
          {song.ocr ? (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-white/5 px-2.5 py-1 text-muted">Confiança média: {song.ocr.confidence}%</span>
              {song.ocr.lowConfidenceCount > 0 ? <span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-amber-200">{song.ocr.lowConfidenceCount} linha(s) para revisar</span> : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 rounded-2xl border border-white/10 bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">Áudio</p>
            <p className="mt-1 text-xs text-muted">Arquivo associado à música para reprodução local.</p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm">
            <AudioLines size={15} /> Anexar áudio
            <input className="hidden" type="file" accept="audio/*" onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onAttachAudio(file);
              event.currentTarget.value = "";
            }} />
          </label>
        </div>
        {song.media?.audioUrl ? <p className="mt-3 text-xs text-brand-soft">Áudio anexado.</p> : null}
      </div>

      <div className="mt-6 space-y-4">
        {song.sections.map((section, sectionIndex) => (
          <div key={section.id} className="rounded-3xl border border-white/10 bg-surface p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={section.type}
                options={sectionTypes}
                onChange={(value) => changeSection(section.id, (current) => ({ ...current, type: value }))}
                ariaLabel={`Tipo da seção ${sectionIndex + 1}`}
                className="w-40 shrink-0"
              />
              <input
                className={`${inputClass} ${errors[`section-${section.id}`] ? "border-red-400/60" : ""}`}
                aria-label={`Nome da seção ${sectionIndex + 1}`}
                aria-invalid={Boolean(errors[`section-${section.id}`])}
                value={section.label ?? ""}
                onChange={(event) => changeSection(section.id, (current) => ({ ...current, label: event.target.value }))}
              />
              <span className="text-xs text-muted">#{sectionIndex + 1}</span>
              <div className="ml-auto flex gap-1">
                <button type="button" className="rounded-lg p-2 text-muted disabled:opacity-30" onClick={() => onMoveSection(section.id, -1)} disabled={sectionIndex === 0} aria-label={`Mover seção ${sectionIndex + 1} para cima`}><ArrowUp size={15} /></button>
                <button type="button" className="rounded-lg p-2 text-muted disabled:opacity-30" onClick={() => onMoveSection(section.id, 1)} disabled={sectionIndex === song.sections.length - 1} aria-label={`Mover seção ${sectionIndex + 1} para baixo`}><ArrowDown size={15} /></button>
                <button type="button" className="rounded-lg p-2 text-muted disabled:opacity-30 hover:text-red-200" onClick={() => onRemoveSection(section.id)} disabled={song.sections.length <= 1} aria-label={`Remover seção ${sectionIndex + 1}`}><Trash2 size={15} /></button>
              </div>
            </div>
            {errors[`section-${section.id}`] ? <span className="mt-1 block text-xs text-red-300">{errors[`section-${section.id}`]}</span> : null}

            <div className="mt-4 space-y-2">
              {section.lines.map((item, lineIndex) => (
                <div key={item.id} className="grid gap-2 md:grid-cols-[1fr_260px_auto]">
                  <div>
                    {item.ocrConfidence !== undefined && item.ocrConfidence < 70 ? (
                      <span className="mb-1 inline-flex rounded-full bg-amber-400/10 px-2 py-1 text-[11px] font-semibold text-amber-200">
                        Baixa confiança: {item.ocrConfidence}%
                      </span>
                    ) : null}
                    <input
                      className={`${inputClass} ${item.ocrConfidence !== undefined && item.ocrConfidence < 70 ? "border-amber-400/50" : ""} ${errors[`line-${item.id}`] ? "border-red-400/60" : ""}`}
                      aria-label={`Letra da linha ${lineIndex + 1} da seção ${sectionIndex + 1}`}
                      placeholder="Letra"
                      value={item.text}
                      onChange={(event) => changeLine(section.id, item.id, (current) => ({ ...current, text: event.target.value }))}
                    />
                    {errors[`line-${item.id}`] ? <span className="mt-1 block text-xs text-red-300">{errors[`line-${item.id}`]}</span> : null}
                  </div>
                  <input
                    className={`${inputClass} font-mono text-chord`}
                    aria-label={`Acordes da linha ${lineIndex + 1} da seção ${sectionIndex + 1}`}
                    placeholder="G@0 C@20 D@35"
                    value={chordText(item.chords)}
                    onChange={(event) => changeLine(section.id, item.id, (current) => ({ ...current, chords: parseChords(event.target.value) }))}
                  />
                  <button type="button" className="rounded-lg border border-white/10 p-2 text-muted disabled:opacity-30" onClick={() => onMoveLine(section.id, item.id, -1)} disabled={lineIndex === 0} aria-label={`Mover linha ${lineIndex + 1} para cima`}><ArrowUp size={14} /></button>
                  <button type="button" className="rounded-lg border border-white/10 p-2 text-muted disabled:opacity-30" onClick={() => onMoveLine(section.id, item.id, 1)} disabled={lineIndex === section.lines.length - 1} aria-label={`Mover linha ${lineIndex + 1} para baixo`}><ArrowDown size={14} /></button>
                  <button type="button" className="rounded-xl border border-white/10 px-3 text-muted hover:text-red-200" onClick={() => onRemoveLine(section.id, item.id)} aria-label={`Remover linha ${lineIndex + 1} da seção ${sectionIndex + 1}`}><X size={15} /></button>
                </div>
              ))}
              {errors[`lines-${section.id}`] ? <p className="text-xs text-red-300">{errors[`lines-${section.id}`]}</p> : null}
            </div>

            <button type="button" className="mt-3 inline-flex items-center gap-2 rounded-xl border border-dashed border-white/10 px-3 py-2 text-sm text-muted" onClick={() => onAddLine(section.id)}>
              <Plus size={15} /> Linha
            </button>
          </div>
        ))}
      </div>

      <TimelineEditor song={song} onUpdate={onTimelineUpdate} />

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm" onClick={onAddSection}><Plus size={15} /> Seção</button>
        <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm" onClick={onBuildTimeline}><AudioLines size={15} /> Timeline inicial</button>
      </div>
    </section>
  );
}

function OriginalImportPreview({
  url,
  fileName,
  mimeType,
  size,
  error,
}: {
  url: string | null;
  fileName: string | null;
  mimeType: string;
  size: number;
  error: string;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-brand/20 bg-brand/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">Arquivo original</p>
          <p className="mt-1 text-xs text-muted">{fileName || "Arquivo importado"} · {(size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
        <span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-200">Revisão obrigatória</span>
      </div>

      {error ? <p role="alert" className="mt-3 text-xs text-red-300">{error}</p> : null}
      {!error && url ? (
        mimeType === "application/pdf" ? (
          <iframe
            className="mt-4 h-[520px] w-full rounded-xl border border-white/10 bg-white"
            src={url}
            title="Pré-visualização do arquivo original"
            sandbox=""
          />
        ) : (
          <div className="mt-4 overflow-auto rounded-xl border border-white/10 bg-black/20 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={fileName ? `Pré-visualização de ${fileName}` : "Pré-visualização da cifra importada"}
              className="mx-auto max-h-[520px] max-w-full rounded-lg object-contain"
            />
          </div>
        )
      ) : (
        <div role="status" className="mt-4 rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-muted">
          Carregando pré-visualização...
        </div>
      )}

      <p className="mt-3 text-xs text-muted">
        A imagem/PDF é apenas a fonte original. O conteúdo extraído deverá ser revisado antes da publicação.
      </p>
    </div>
  );
}

function TimelineEditor({
  song,
  onUpdate,
}: {
  song: Song;
  onUpdate: (patch: Partial<Song>) => void;
}) {
  const timeline = song.timeline ?? { bpm: song.bpm ?? 120, timeSignature: [4, 4] as [number, number], events: [] };
  const events = [...timeline.events].sort((a, b) => a.atMs - b.atMs);

  function updateTimeline(patch: { bpm?: number; timeSignature?: [number, number]; events?: SongTimelineEvent[] }) {
    onUpdate({ timeline: { ...timeline, ...patch, events: patch.events ?? timeline.events } });
  }

  function addEvent(sectionId: string, lineId?: string) {
    const last = events.at(-1);
    const nextAtMs = (last?.atMs ?? -1000) + 1000;
    updateTimeline({
      events: [
        ...timeline.events,
        { atMs: nextAtMs, sectionId, lineId },
      ],
    });
  }

  function updateEvent(index: number, patch: Partial<SongTimelineEvent>) {
    const next = events.map((event, eventIndex) => (eventIndex === index ? { ...event, ...patch } : event));
    updateTimeline({ events: next });
  }

  function removeEvent(index: number) {
    updateTimeline({ events: events.filter((_, eventIndex) => eventIndex !== index) });
  }

  const sectionOptions: Array<{ value: string; label: string; sectionId: string; lineId?: string }> = song.sections.flatMap((section) =>
    section.lines.length
      ? section.lines.map((line) => ({
          value: `${section.id}::${line.id}`,
          label: `${sectionName(section)} · ${line.text || "Linha"}`,
          sectionId: section.id,
          lineId: line.id,
        }))
      : [{ value: section.id, label: sectionName(section), sectionId: section.id }],
  );

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-surface p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-semibold">Timeline visual</p>
          <p className="mt-1 text-xs text-muted">Ajuste eventos em milissegundos, BPM e compasso. Eventos são ordenados pela posição temporal.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="text-xs text-muted">
            BPM
            <input
              className={`${inputClass} mt-1 w-28`}
              type="number"
              min={1}
              max={300}
              value={timeline.bpm ?? ""}
              onChange={(event) => updateTimeline({ bpm: event.target.value ? Number(event.target.value) : undefined })}
              aria-label="BPM da timeline"
            />
          </label>
          <label className="text-xs text-muted">
            Compasso
            <select
              className={`${inputClass} mt-1 w-28`}
              value={`${timeline.timeSignature?.[0] ?? 4}/${timeline.timeSignature?.[1] ?? 4}`}
              onChange={(event) => {
                const [numerator, denominator] = event.target.value.split("/").map(Number);
                if (Number.isFinite(numerator) && Number.isFinite(denominator)) updateTimeline({ timeSignature: [numerator, denominator] as [number, number] });
              }}
              aria-label="Fórmula de compasso"
            >
              <option value="2/4">2/4</option>
              <option value="3/4">3/4</option>
              <option value="4/4">4/4</option>
              <option value="6/8">6/8</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[760px] rounded-xl border border-white/10 bg-background p-3">
          <div className="relative h-12">
            <div className="absolute inset-x-0 top-6 h-px bg-white/10" />
            {events.map((event, index) => {
              const maxAt = Math.max(events.at(-1)?.atMs ?? 1000, 1000);
              const left = Math.min(96, Math.max(4, (event.atMs / maxAt) * 92 + 4));
              return (
                <button
                  key={`${event.sectionId}-${event.lineId ?? "section"}-${event.atMs}`}
                  type="button"
                  className="absolute top-2 -translate-x-1/2"
                  style={{ left: `${left}%` }}
                  onClick={() => document.getElementById(`timeline-event-${index}`)?.scrollIntoView({ block: "nearest" })}
                  aria-label={`Evento em ${event.atMs} milissegundos`}
                >
                  <span className="block size-3 rounded-full bg-brand ring-4 ring-brand/10" />
                </button>
              );
            })}
          </div>
          {events.length === 0 ? <p className="py-6 text-center text-sm text-muted">Nenhum evento criado.</p> : null}
          <div className="mt-3 space-y-2">
            {events.map((event, index) => {
              const selectedValue = event.lineId ? `${event.sectionId}::${event.lineId}` : event.sectionId;
              return (
                <div id={`timeline-event-${index}`} key={`${event.sectionId}-${event.lineId ?? "section"}-${index}`} className="grid gap-2 rounded-xl border border-white/10 p-3 md:grid-cols-[150px_1fr_1fr_auto]">
                  <label className="text-xs text-muted">
                    Tempo (ms)
                    <input
                      className={`${inputClass} mt-1`}
                      type="number"
                      min={0}
                      value={event.atMs}
                      onChange={(input) => updateEvent(index, { atMs: Math.max(0, Number(input.target.value) || 0) })}
                      aria-label={`Tempo do evento ${index + 1}`}
                    />
                  </label>
                  <label className="text-xs text-muted">
                    Seção / linha
                    <select
                      className={`${inputClass} mt-1`}
                      value={selectedValue}
                      onChange={(input) => {
                        const match = sectionOptions.find((option) => option.value === input.target.value);
                        if (match) updateEvent(index, { sectionId: match.sectionId, lineId: match.lineId });
                      }}
                      aria-label={`Destino do evento ${index + 1}`}
                    >
                      {sectionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                  <label className="text-xs text-muted">
                    Acorde
                    <input
                      className={`${inputClass} mt-1`}
                      value={event.chord ?? ""}
                      onChange={(input) => updateEvent(index, { chord: input.target.value || undefined })}
                      placeholder="Ex.: G"
                      aria-label={`Acorde do evento ${index + 1}`}
                    />
                  </label>
                  <button type="button" className="self-end rounded-xl border border-white/10 px-3 py-2 text-sm hover:text-red-200" onClick={() => removeEvent(index)} aria-label={`Remover evento ${index + 1}`}>
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Select
          value=""
          options={[{ value: "", label: "Adicionar evento..." }, ...sectionOptions.map((option) => ({ value: option.value, label: option.label }))]}
          onChange={(value) => {
            const option = sectionOptions.find((item) => item.value === value);
            if (option) addEvent(option.sectionId, option.lineId);
          }}
          ariaLabel="Adicionar evento à timeline"
          className="min-w-64"
        />
      </div>
    </div>
  );
}

function DetailView({
  song,
  onBack,
  onPlay,
  onEdit,
  onDuplicate,
  onDelete,
  onPresentation,
}: {
  song: Song | null;
  onBack: () => void;
  onPlay: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onPresentation: () => void;
}) {
  if (!song) {
    return (
      <section className="rounded-3xl border border-dashed border-white/15 p-10 text-center">
        <h1 className="text-2xl font-black">Música indisponível</h1>
        <p className="mt-2 text-sm text-muted">A música solicitada não existe mais ou não está disponível na biblioteca.</p>
        <button type="button" className="mt-5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white" onClick={onBack}>Voltar para a biblioteca</button>
      </section>
    );
  }

  const coverUrl = resolveMediaUrl(song.media, "cover");
  const audioUrl = resolveMediaUrl(song.media, "audio");
  const timelineAvailable = Boolean(song.timeline?.events.length);
  const presentationAvailable = song.sections.length > 0;

  return (
    <section>
      <button type="button" className="inline-flex items-center gap-2 text-sm text-muted" onClick={onBack}><ArrowLeft size={15} /> Biblioteca</button>

      <div className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-surface">
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[220px_1fr]">
          <div className="aspect-square overflow-hidden rounded-2xl bg-brand/10">
            {coverUrl ? (
              <img src={coverUrl} alt={`Capa de ${song.title}`} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-5xl font-black text-brand-soft">{song.title.slice(0, 1).toUpperCase()}</div>
            )}
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-soft">Detalhes da música</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{song.title}</h1>
              <p className="mt-2 text-base text-muted">{song.artist || "Artista não informado"}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {song.key ? <span className="rounded-full bg-chord/10 px-3 py-1.5 text-chord">Tonalidade {song.key}</span> : null}
                {song.bpm ? <span className="rounded-full bg-white/5 px-3 py-1.5 text-muted">{song.bpm} BPM</span> : null}
                {song.category ? <span className="rounded-full bg-white/5 px-3 py-1.5 text-muted">{song.category}</span> : null}
                <span className="rounded-full bg-white/5 px-3 py-1.5 text-muted">{song.sections.length} seções</span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button type="button" className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white" onClick={onPlay}><Play size={16} fill="currentColor" /> Tocar</button>
              <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm" onClick={onEdit}><Pencil size={16} /> Editar</button>
              <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm" onClick={onDuplicate}><Plus size={16} /> Duplicar</button>
              <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm" onClick={onPresentation} disabled={!presentationAvailable}><Presentation size={16} /> Apresentar</button>
              <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-red-400/20 px-4 py-2.5 text-sm text-red-200" onClick={onDelete}><Trash2 size={16} /> Excluir</button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-t border-white/10 p-5 sm:grid-cols-3">
          <ResourceCard label="Áudio" available={Boolean(audioUrl)} detail={audioUrl ? "Disponível para reprodução" : "Nenhum áudio associado"} />
          <ResourceCard label="Timeline" available={timelineAvailable} detail={timelineAvailable ? `${song.timeline?.events.length} eventos` : "Ainda não configurada"} />
          <ResourceCard label="Apresentação" available={presentationAvailable} detail={presentationAvailable ? "Estrutura pronta para 16:9" : "Sem estrutura"} />
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-surface p-5 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Estrutura</h2>
            <p className="mt-1 text-sm text-muted">Conteúdo persistido da música.</p>
          </div>
          <span className="text-xs text-muted">{song.sections.reduce((total, section) => total + section.lines.length, 0)} linhas</span>
        </div>
        <div className="mt-5 space-y-6">
          {song.sections.map((section) => (
            <div key={section.id}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-soft">{sectionName(section)}</p>
              <div className="mt-2 space-y-2">
                {section.lines.map((item) => (
                  <div key={item.id} className="rounded-xl bg-background/40 px-3 py-2">
                    <p className="font-medium">{item.text || "Linha instrumental"}</p>
                    {item.chords?.length ? <p className="mt-1 font-mono text-xs text-chord">{chordText(item.chords)}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ResourceCard({ label, available, detail }: { label: string; available: boolean; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-background/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">{label}</span>
        <span className={`rounded-full px-2 py-1 text-[11px] ${available ? "bg-emerald-400/10 text-emerald-200" : "bg-white/5 text-muted"}`}>{available ? "Disponível" : "Indisponível"}</span>
      </div>
      <p className="mt-2 text-xs text-muted">{detail}</p>
    </div>
  );
}

function PlayerView({
  song,
  transpose,
  preferences,
  activeLineId,
  autoScrollPaused,
  onToggleAutoScrollPaused,
  activeSectionId,
  timelineSynced,
  currentSecond,
  playing,
  audioRef,
  onBack,
  onEdit,
  onTranspose,
  onPreferences,
  onResetPreferences,
  onToggleAudio,
  onTime,
  audioDuration,
  audioVolume,
  audioPlaybackRate,
  audioError,
  onAudioLoaded,
  onAudioError,
  onAudioEnded,
  onSeek,
  onVolume,
  onPlaybackRate,
  onResetAudioPosition,
  favorite,
  onFavorite,
}: {
  song: Song | null;
  transpose: number;
  preferences: typeof defaultPlayerPreferences;
  activeLineId: string | null;
  autoScrollPaused: boolean;
  onToggleAutoScrollPaused: () => void;
  activeSectionId: string | null;
  timelineSynced: boolean;
  currentSecond: number;
  playing: boolean;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  onBack: () => void;
  onEdit: () => void;
  onTranspose: (value: number) => void;
  onPreferences: (patch: Partial<typeof defaultPlayerPreferences>) => void;
  onResetPreferences: () => void;
  onToggleAudio: () => void;
  onTime: (seconds: number) => void;
  audioDuration: number;
  audioVolume: number;
  audioPlaybackRate: number;
  audioError: boolean;
  onAudioLoaded: () => void;
  onAudioError: () => void;
  onAudioEnded: () => void;
  onSeek: (seconds: number) => void;
  onVolume: (value: number) => void;
  onPlaybackRate: (value: number) => void;
  onResetAudioPosition: () => void;
  favorite: boolean;
  onFavorite: () => void;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  useEffect(() => {
    if (!activeLineId || !playing || !preferences.autoScroll || autoScrollPaused) return;
    document.querySelector<HTMLElement>(`[data-player-line-id="${activeLineId}"]`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [activeLineId, autoScrollPaused, playing, preferences.autoScroll]);

  if (!song) return <Empty />;

  const maxWidthClass = {
    narrow: "max-w-2xl",
    comfortable: "max-w-4xl",
    wide: "max-w-6xl",
  }[preferences.maxWidth];

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
  }

  return (
    <section>
      <button type="button" className="inline-flex items-center gap-2 text-sm text-muted" onClick={onBack}><ArrowLeft size={15} /> Biblioteca</button>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight">{song.title}</h1>
            {song.key ? <span className="rounded-full bg-chord/10 px-3 py-1 text-sm text-chord">{transposeKey(song.key, transpose)}</span> : null}
          </div>
          <p className="mt-2 text-sm text-muted">{song.artist || "Artista não informado"}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="rounded-xl border border-white/10 p-2" onClick={onFavorite} aria-label="Favoritar"><Heart size={16} fill={favorite ? "currentColor" : "none"} /></button>
          <button type="button" className="rounded-xl border border-white/10 p-2" onClick={onEdit} aria-label="Editar"><Pencil size={16} /></button>
          <button type="button" className="rounded-xl border border-white/10 px-3 py-2 text-sm" onClick={() => onPreferences({ autoScroll: !preferences.autoScroll })}>Auto-scroll {preferences.autoScroll ? "on" : "off"}</button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-surface p-3">
        <button type="button" className="rounded-xl bg-brand px-3 py-2 text-sm" onClick={() => onTranspose(transpose + 1)}>+ ½</button>
        <button type="button" className="rounded-xl border border-white/10 px-3 py-2 text-sm" onClick={() => onTranspose(0)}>Original</button>
        <button type="button" className="rounded-xl bg-brand px-3 py-2 text-sm" onClick={() => onTranspose(transpose - 1)}>− ½</button>
        <button type="button" className="rounded-xl border border-white/10 px-3 py-2 text-sm" onClick={() => onPreferences({ fontScale: Math.max(0.8, preferences.fontScale - 0.1) })}>A−</button>
        <button type="button" className="rounded-xl border border-white/10 px-3 py-2 text-sm" onClick={() => onPreferences({ fontScale: Math.min(1.6, preferences.fontScale + 0.1) })}>A+</button>
        <button type="button" className="rounded-xl border border-white/10 px-3 py-2 text-sm" onClick={() => onPreferences({ lineSpacing: Math.max(1.2, preferences.lineSpacing - 0.15) })}>Espaço −</button>
        <button type="button" className="rounded-xl border border-white/10 px-3 py-2 text-sm" onClick={() => onPreferences({ lineSpacing: Math.min(2.4, preferences.lineSpacing + 0.15) })}>Espaço +</button>
        <button type="button" className={`rounded-xl border px-3 py-2 text-sm ${preferences.highContrast ? "border-brand bg-brand/10" : "border-white/10"}`} onClick={() => onPreferences({ highContrast: !preferences.highContrast })} aria-pressed={preferences.highContrast}>Alto contraste</button>
        <button type="button" className="rounded-xl border border-white/10 px-3 py-2 text-sm" onClick={() => onPreferences({ maxWidth: preferences.maxWidth === "narrow" ? "comfortable" : preferences.maxWidth === "comfortable" ? "wide" : "narrow" })}>Largura</button>
        <button type="button" className="rounded-xl border border-white/10 px-3 py-2 text-sm" onClick={toggleFullscreen} aria-label={isFullscreen ? "Sair da tela cheia" : "Entrar em tela cheia"}>{isFullscreen ? "Sair tela cheia" : "Tela cheia"}</button>
        <button type="button" className="rounded-xl border border-white/10 px-3 py-2 text-sm" onClick={onResetPreferences}>Restaurar padrão</button>
        <span className="ml-auto text-xs text-muted">{Math.floor(currentSecond / 60).toString().padStart(2, "0")}:{Math.floor(currentSecond % 60).toString().padStart(2, "0")}</span>
      </div>

      {song.media?.audioUrl ? (
        <div className="mt-3 rounded-2xl border border-white/10 bg-surface p-3 sm:p-4">
          {/* biome-ignore lint/a11y/useMediaCaption: music practice audio does not contain spoken dialogue. */}
          <audio
            ref={audioRef}
            data-song-id={song.id}
            className="hidden"
            src={song.media.audioUrl}
            preload="metadata"
            onLoadedMetadata={onAudioLoaded}
            onTimeUpdate={(event) => onTime(event.currentTarget.currentTime)}
            onEnded={() => { onTime(0); onResetAudioPosition(); onAudioEnded(); }}
            onError={onAudioError}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand text-white" onClick={onToggleAudio} aria-label={playing ? "Pausar áudio" : "Tocar áudio"}>
              {playing ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}
            </button>
            <span className="min-w-24 text-xs font-mono text-muted">{formatTime(currentSecond)} / {formatTime(audioDuration)}</span>
            <input className="min-w-40 flex-1" type="range" min="0" max={Math.max(audioDuration, 0)} step="0.1" value={Math.min(currentSecond, audioDuration || 0)} onChange={(event) => onSeek(Number(event.target.value))} aria-label="Progresso do áudio" disabled={!audioDuration} />
            <button type="button" className="rounded-xl border border-white/10 p-2" onClick={() => onVolume(audioVolume > 0 ? 0 : 1)} aria-label={audioVolume > 0 ? "Silenciar áudio" : "Ativar som"}>
              {audioVolume > 0 ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <select className="rounded-xl border border-white/10 bg-transparent px-2 py-2 text-xs" value={audioPlaybackRate} onChange={(event) => onPlaybackRate(Number(event.target.value))} aria-label="Velocidade de reprodução">
              {[0.75, 1, 1.25, 1.5, 2].map((rate) => <option key={rate} value={rate}>{rate}x</option>)}
            </select>
            <button type="button" className="rounded-xl border border-white/10 px-3 py-2 text-xs" onClick={onResetAudioPosition}>Recomeçar</button>
          </div>
          {audioError ? <p role="alert" className="mt-3 text-xs text-red-300">Não foi possível reproduzir este áudio. Verifique o arquivo e tente novamente.</p> : null}
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/10 bg-surface px-3 py-2 text-xs">
        <span>{song.timeline?.events.length ? (timelineSynced ? "Sincronizado" : "Aguardando evento") : "Sem sincronização"}</span>
        <span className="text-muted">{song.timeline?.events.length ? "Timeline" : "Sem timeline"}</span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-surface px-3 py-2 text-xs">
        <span className="text-muted">Rolagem automática</span>
        <button
          type="button"
          className="rounded-xl border border-white/10 px-3 py-1.5 font-semibold"
          aria-pressed={preferences.autoScroll && !autoScrollPaused}
          onClick={onToggleAutoScrollPaused}
          disabled={!preferences.autoScroll}
        >
          {preferences.autoScroll ? (autoScrollPaused ? "Retomar" : "Pausar") : "Desativada"}
        </button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-surface p-2">
        <nav className="flex min-w-max gap-2" aria-label="Navegação entre seções">
          {song.sections.map((section, index) => (
            <button
              key={section.id}
              type="button"
              aria-current={activeSectionId === section.id ? "location" : undefined}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition hover:border-brand/30 hover:text-foreground ${activeSectionId === section.id ? "border-brand bg-brand/10 text-foreground" : "border-white/10 text-muted"}`}
              onClick={() => document.getElementById(`player-section-${section.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              {index + 1}. {sectionName(section)}
            </button>
          ))}
        </nav>
      </div>

      <div className={`mx-auto mt-6 w-full ${maxWidthClass} space-y-8 rounded-3xl border p-5 sm:p-8 ${preferences.highContrast ? "border-white/40 bg-black text-white" : "border-white/10 bg-surface"}`} style={{ fontSize: `${preferences.fontScale}rem` }}>
        {song.sections.map((section) => (
          <section key={section.id} id={`player-section-${section.id}`}>
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-white/8" />
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-soft">{sectionName(section)}</span>
              <span className="h-px flex-1 bg-white/8" />
            </div>
            <div className="space-y-4">
              {section.lines.map((item) => (
                <div key={item.id} data-player-line-id={item.id} className={`rounded-2xl px-3 py-2 ${activeLineId === item.id ? "bg-brand/10 ring-1 ring-brand/20" : ""} ${preferences.highContrast ? "border border-white/20" : ""}`}>
                  <div className="relative min-h-7 font-mono text-sm">
                    {(item.chords ?? []).map((chord) => (
                      <span key={`${item.id}-${chord.position}-${chord.chord}`} className={`absolute top-0 font-semibold text-chord ${preferences.highContrast ? "underline decoration-2 underline-offset-4" : ""}`} style={{ left: `${chord.position}ch` }}>{transposeChord(chord.chord, transpose)}</span>
                    ))}
                  </div>
                  <p className="whitespace-pre-wrap font-medium" style={{ lineHeight: preferences.lineSpacing }}>{item.text || " "}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
}

function PresentationView({ song, index, onIndex, onBack }: { song: Song | null; index: number; onIndex: (value: number) => void; onBack: () => void }) {
  const section = song?.sections[index] ?? null;

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-soft">Apresentação</p>
          <h1 className="mt-2 text-3xl font-black">Modo 16:9</h1>
        </div>
        <button type="button" className="rounded-xl border border-white/10 px-3 py-2 text-sm" onClick={onBack}>Player</button>
      </div>

      <div className="mt-6 aspect-video rounded-3xl border border-white/10 bg-black p-[4%]">
        {song && section ? (
          <div className="flex h-full flex-col justify-center">
            <p className="text-[1.5vw] uppercase tracking-[0.18em] text-brand-soft">{song.title} · {sectionName(section)}</p>
            <div className="mt-[3vw] space-y-[2vw]">
              {section.lines.slice(0, 4).map((item) => <p key={item.id} className="text-[3.3vw] font-semibold leading-tight">{item.text}</p>)}
            </div>
          </div>
        ) : (
          <div className="grid h-full place-items-center text-muted">Abra uma música primeiro.</div>
        )}
      </div>

      {song ? (
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/10 bg-surface p-3">
          <button type="button" className="rounded-xl p-2" onClick={() => onIndex(Math.max(0, index - 1))} disabled={index === 0}><ArrowLeft size={17} /></button>
          <span className="text-xs text-muted">{index + 1} / {song.sections.length}</span>
          <button type="button" className="rounded-xl p-2" onClick={() => onIndex(Math.min(song.sections.length - 1, index + 1))} disabled={index === song.sections.length - 1}><ArrowRight size={17} /></button>
        </div>
      ) : null}
    </section>
  );
}

function SettingsView({ theme, songs, onTheme, onImport, onExport, message }: { theme: LibraryState["theme"]; songs: Song[]; onTheme: (theme: LibraryState["theme"]) => void; onImport: (file: File) => void; onExport: () => void; message: string }) {
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-soft">Configurações</p>
      <h1 className="mt-2 text-3xl font-black">Seu ambiente</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-surface p-5">
          <h2 className="font-semibold">Tema</h2>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {(["purple", "gold", "blue"] as const).map((value) => (
              <button key={value} type="button" className={`rounded-xl border px-3 py-2 text-sm ${theme === value ? "border-brand bg-brand/10 text-brand-soft" : "border-white/10 text-muted"}`} onClick={() => onTheme(value)}>
                {value === "purple" ? "Roxo" : value === "gold" ? "Dourado" : "Azul"}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-surface p-5">
          <h2 className="font-semibold">Catálogo</h2>
          <p className="mt-2 text-sm text-muted">{songs.length} músicas salvas neste navegador.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="rounded-xl border border-white/10 px-3 py-2 text-sm" onClick={onExport}>Exportar JSON</button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm">
              Importar JSON
              <input className="hidden" type="file" accept=".json,application/json" onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onImport(file);
                event.currentTarget.value = "";
              }} />
            </label>
          </div>
          {message ? <p className="mt-3 text-xs text-brand-soft">{message}</p> : null}
        </div>
      </div>
    </section>
  );
}

function Empty() {
  return <div className="rounded-3xl border border-dashed border-white/15 p-10 text-center text-muted">Selecione uma música na biblioteca.</div>;
}
