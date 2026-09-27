"use client";

import {
  ArrowLeft,
  ArrowRight,
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
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { Select } from "@/components/ui/select";
import { sampleSong } from "@/domain/songs/fixtures";
import {
  cloneSong,
  createSongId,
  loadLibraryState,
  loadSongs,
  saveLibraryState,
  saveSongs,
  slugify,
  type LibraryState,
} from "@/domain/songs/repository";
import { transposeChord, transposeKey } from "@/domain/songs/transpose";
import type { ChordPlacement, Song, SongLine, SongSection, SongSectionType } from "@/domain/songs/types";

type View = "library" | "editor" | "player" | "presentation" | "settings";
type SortMode = "title" | "artist" | "recent";

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
  const [library, setLibrary] = useState<LibraryState>({
    favorites: [],
    recent: [],
    playlists: [],
    theme: "gold",
  });

  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(true);
  const [view, setView] = useState<View>("library");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Song | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("title");
  const [category, setCategory] = useState("all");
  const [transpose, setTranspose] = useState(0);
  const [fontScale, setFontScale] = useState(1);
  const [autoScroll, setAutoScroll] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [currentSecond, setCurrentSecond] = useState(0);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const [presentationSection, setPresentationSection] = useState(0);
  const [theme, setTheme] = useState<LibraryState["theme"]>("purple");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const stored = loadSongs();
    setSongs(stored.length > 0 ? stored : [cloneSong(sampleSong)]);
    const storedLibrary = loadLibraryState();
    setLibrary(storedLibrary);
    setTheme(storedLibrary.theme);
  }, []);

  useEffect(() => {
    if (songs.length > 0) saveSongs(songs);
  }, [songs]);

  useEffect(() => {
    saveLibraryState({ ...library, theme });
  }, [library, theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

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

  useEffect(() => {
    if (!playing || !audioRef.current || !song?.timeline?.events.length) return undefined;

    const timer = window.setInterval(() => {
      const audio = audioRef.current;
      if (!audio) return;
      setCurrentSecond(audio.currentTime);
      const current = [...(song.timeline?.events ?? [])]
        .sort((a, b) => a.atMs - b.atMs)
        .filter((event) => event.atMs / 1000 <= audio.currentTime)
        .at(-1);
      setActiveLineId(current?.lineId ?? null);
    }, 120);

    return () => window.clearInterval(timer);
  }, [playing, song]);

  function openSong(id: string) {
    setSelectedId(id);
    setTranspose(0);
    setCurrentSecond(0);
    setActiveLineId(null);
    setPresentationSection(0);
    setLibrary((state) => ({
      ...state,
      recent: [id, ...state.recent.filter((item) => item !== id)].slice(0, 20),
    }));
    setView("player");
  }

  function startNew() {
    setDraft(emptySong());
    setMobileMenu(false);
    setView("editor");
  }

  function startEdit(item: Song) {
    setDraft(cloneSong(item));
    setSelectedId(item.id);
    setMobileMenu(false);
    setView("editor");
  }

  function saveDraft() {
    if (!draft?.title.trim()) return;
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
    setDraft(null);
    setView("player");
  }

  function deleteSong(id: string) {
    const item = songs.find((songItem) => songItem.id === id);
    if (!item || !window.confirm(`Excluir "${item.title}"?`)) return;
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

  function exportJson() {
    const blob = new Blob([JSON.stringify(songs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "cifrases-musicas.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function toggleAudio() {
    const audio = audioRef.current;
    if (!audio || !song?.media?.audioUrl) return;
    if (audio.paused) {
      void audio.play();
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  const content = (
    <>
      {view === "library" ? (
        <LibraryView
          songs={filteredSongs}
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
          onImport={importJson}
        />
      ) : null}

      {view === "editor" && draft ? (
        <EditorView
          song={draft}
          setSong={setDraft}
          onSave={saveDraft}
          onCancel={() => setView(song ? "player" : "library")}
          onAddSection={addSection}
          onAddLine={addLine}
          onAttachAudio={attachAudio}
          onBuildTimeline={buildTimeline}
        />
      ) : null}

      {view === "player" ? (
        <PlayerView
          song={song}
          transpose={transpose}
          fontScale={fontScale}
          activeLineId={activeLineId}
          autoScroll={autoScroll}
          currentSecond={currentSecond}
          playing={playing}
          audioRef={audioRef}
          onBack={() => setView("library")}
          onEdit={() => song && startEdit(song)}
          onTranspose={setTranspose}
          onFontScale={setFontScale}
          onAutoScroll={() => setAutoScroll((value) => !value)}
          onToggleAudio={toggleAudio}
          onTime={(seconds) => setCurrentSecond(seconds)}
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
            <NavButton icon={<Library size={17} />} label="Biblioteca" active={view === "library"} collapsed={desktopSidebarCollapsed} onClick={() => setView("library")} />
            <NavButton icon={<PencilIcon />} label="Editor" active={view === "editor"} collapsed={desktopSidebarCollapsed} onClick={() => startEdit(song ?? songs[0] ?? emptySong())} />
            <NavButton icon={<Presentation size={17} />} label="Apresentação" active={view === "presentation"} collapsed={desktopSidebarCollapsed} onClick={() => setView("presentation")} />
            <NavButton icon={<Settings2 size={17} />} label="Configurações" active={view === "settings"} collapsed={desktopSidebarCollapsed} onClick={() => setView("settings")} />
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
  onImport,
}: {
  songs: Song[];
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
  onImport: (file: File) => void;
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
            <Upload size={15} /> Importar
            <input className="hidden" type="file" accept=".json,application/json" onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImport(file);
              event.currentTarget.value = "";
            }} />
          </label>
        </div>
      </div>

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

      {songs.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-white/15 p-10 text-center">
          <Library className="mx-auto text-brand-soft" size={30} />
          <h2 className="mt-3 font-bold">Nenhuma música encontrada</h2>
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
  onSave,
  onCancel,
  onAddSection,
  onAddLine,
  onAttachAudio,
  onBuildTimeline,
}: {
  song: Song;
  setSong: (song: Song | null) => void;
  onSave: () => void;
  onCancel: () => void;
  onAddSection: () => void;
  onAddLine: (sectionId: string) => void;
  onAttachAudio: (file: File) => void;
  onBuildTimeline: () => void;
}) {
  function changeSection(sectionId: string, updater: (section: SongSection) => SongSection) {
    setSong({
      ...song,
      sections: song.sections.map((section) =>
        section.id === sectionId ? updater(section) : section,
      ),
    });
  }

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-soft">Editor</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Cadastrar música</h1>
        </div>
        <div className="flex gap-2">
          <button type="button" className="rounded-xl border border-white/10 px-3 py-2 text-sm" onClick={onCancel}>Cancelar</button>
          <button type="button" className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white" onClick={onSave}><Save size={15} /> Salvar</button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          ["Título", song.title, (value: string) => setSong({ ...song, title: value })],
          ["Artista", song.artist ?? "", (value: string) => setSong({ ...song, artist: value })],
          ["Categoria", song.category ?? "", (value: string) => setSong({ ...song, category: value })],
          ["Tonalidade", song.key ?? "", (value: string) => setSong({ ...song, key: value.toUpperCase() })],
          ["BPM", String(song.bpm ?? ""), (value: string) => setSong({ ...song, bpm: Number(value) || undefined })],
        ].map(([label, value, update]) => (
          <label key={label as string}>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label as string}</span>
            <input className={inputClass} value={value as string} onChange={(event) => (update as (value: string) => void)(event.target.value)} />
          </label>
        ))}
      </div>

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
                {sectionTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}

              <input className={inputClass} aria-label={`Nome da seção ${sectionIndex + 1}`} value={section.label ?? ""} onChange={(event) => changeSection(section.id, (current) => ({ ...current, label: event.target.value }))} />
              <span className="text-xs text-muted">#{sectionIndex + 1}</span>
            </div>

            <div className="mt-4 space-y-2">
              {section.lines.map((item, lineIndex) => (
                <div key={item.id} className="grid gap-2 md:grid-cols-[1fr_260px]">
                  <input className={inputClass} aria-label={`Letra da linha ${lineIndex + 1} da seção ${sectionIndex + 1}`} placeholder="Letra" value={item.text} onChange={(event) => changeSection(section.id, (current) => ({
                    ...current,
                    lines: current.lines.map((currentLine) => currentLine.id === item.id ? { ...currentLine, text: event.target.value } : currentLine),
                  }))} />
                  <input className={`${inputClass} font-mono text-chord`} aria-label={`Acordes da linha ${lineIndex + 1} da seção ${sectionIndex + 1}`} placeholder="G@0 C@20 D@35" value={chordText(item.chords)} onChange={(event) => changeSection(section.id, (current) => ({
                    ...current,
                    lines: current.lines.map((currentLine) => currentLine.id === item.id ? { ...currentLine, chords: parseChords(event.target.value) } : currentLine),
                  }))} />
                </div>
              ))}
            </div>

            <button type="button" className="mt-3 inline-flex items-center gap-2 rounded-xl border border-dashed border-white/10 px-3 py-2 text-sm text-muted" onClick={() => onAddLine(section.id)}>
              <Plus size={15} /> Linha
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm" onClick={onAddSection}><Plus size={15} /> Seção</button>
        <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm" onClick={onBuildTimeline}><AudioLines size={15} /> Timeline inicial</button>
      </div>
    </section>
  );
}

function PlayerView({
  song,
  transpose,
  fontScale,
  activeLineId,
  autoScroll,
  currentSecond,
  playing,
  audioRef,
  onBack,
  onEdit,
  onTranspose,
  onFontScale,
  onAutoScroll,
  onToggleAudio,
  onTime,
  favorite,
  onFavorite,
}: {
  song: Song | null;
  transpose: number;
  fontScale: number;
  activeLineId: string | null;
  autoScroll: boolean;
  currentSecond: number;
  playing: boolean;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  onBack: () => void;
  onEdit: () => void;
  onTranspose: (value: number) => void;
  onFontScale: (value: number) => void;
  onAutoScroll: () => void;
  onToggleAudio: () => void;
  onTime: (seconds: number) => void;
  favorite: boolean;
  onFavorite: () => void;
}) {
  if (!song) return <Empty />;

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
          <button type="button" className="rounded-xl border border-white/10 px-3 py-2 text-sm" onClick={onAutoScroll}>Auto-scroll {autoScroll ? "on" : "off"}</button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-surface p-3">
        <button type="button" className="rounded-xl bg-brand px-3 py-2 text-sm" onClick={() => onTranspose(transpose + 1)}>+ ½</button>
        <button type="button" className="rounded-xl border border-white/10 px-3 py-2 text-sm" onClick={() => onTranspose(0)}>Original</button>
        <button type="button" className="rounded-xl bg-brand px-3 py-2 text-sm" onClick={() => onTranspose(transpose - 1)}>− ½</button>
        <button type="button" className="rounded-xl border border-white/10 px-3 py-2 text-sm" onClick={() => onFontScale(Math.max(0.8, fontScale - 0.1))}>A−</button>
        <button type="button" className="rounded-xl border border-white/10 px-3 py-2 text-sm" onClick={() => onFontScale(Math.min(1.6, fontScale + 0.1))}>A+</button>
        <span className="ml-auto text-xs text-muted">{Math.floor(currentSecond / 60).toString().padStart(2, "0")}:{Math.floor(currentSecond % 60).toString().padStart(2, "0")}</span>
      </div>

      {song.media?.audioUrl ? (
        <div className="mt-3 rounded-2xl border border-white/10 bg-surface p-3">
          {/* biome-ignore lint/a11y/useMediaCaption: music practice audio does not contain spoken dialogue. */}
          <audio ref={audioRef} className="hidden" src={song.media.audioUrl} onTimeUpdate={(event) => onTime(event.currentTarget.currentTime)} onEnded={() => onTime(0)} />
          <button type="button" className="grid size-11 place-items-center rounded-xl bg-brand text-white" onClick={onToggleAudio} aria-label={playing ? "Pausar áudio" : "Tocar áudio"}>
            {playing ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}
          </button>
        </div>
      ) : null}

      <div className="mt-6 space-y-8 rounded-3xl border border-white/10 bg-surface p-5 sm:p-8" style={{ fontSize: `${fontScale}rem` }}>
        {song.sections.map((section) => (
          <section key={section.id}>
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-white/8" />
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-soft">{sectionName(section)}</span>
              <span className="h-px flex-1 bg-white/8" />
            </div>
            <div className="space-y-4">
              {section.lines.map((item) => (
                <div key={item.id} className={`rounded-2xl px-3 py-2 ${activeLineId === item.id ? "bg-brand/10 ring-1 ring-brand/20" : ""}`}>
                  <div className="relative min-h-7 font-mono text-sm">
                    {(item.chords ?? []).map((chord) => (
                      <span key={`${item.id}-${chord.position}-${chord.chord}`} className="absolute top-0 font-semibold text-chord" style={{ left: `${chord.position}ch` }}>{transposeChord(chord.chord, transpose)}</span>
                    ))}
                  </div>
                  <p className="whitespace-pre-wrap font-medium leading-8">{item.text || " "}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
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
