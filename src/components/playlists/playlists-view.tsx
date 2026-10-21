"use client";

import {
  ArrowDown,
  ArrowUp,
  ListMusic,
  Pencil,
  Play,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { ConfirmDialog, TextDialog } from "@/components/ui/dialog";
import type { PlanEntry } from "@/domain/songs/playlist-import";
import { groupPlaylist, type Playlist } from "@/domain/songs/playlists";
import type { Song } from "@/domain/songs/types";

const inputClass =
  "h-11 w-full rounded-xl border border-control-border bg-control-background px-3 text-sm text-foreground outline-none placeholder:text-control-placeholder focus:border-brand/50 focus:bg-control-background-hover sm:h-10";

const primaryButton =
  "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white sm:min-h-10";
const secondaryButton =
  "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/5 sm:min-h-10";

function IconButton({
  label,
  onClick,
  disabled,
  focusId,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  focusId?: string;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      data-focus={focusId}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-white/10 sm:size-9 ${danger ? "hover:text-red-300" : "hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}

type Dialog =
  | { kind: "rename-playlist"; id: string; name: string }
  | { kind: "delete-playlist"; id: string; name: string }
  | { kind: "rename-block"; id: string; blockId: string; name: string }
  | { kind: "delete-block"; id: string; blockId: string; name: string };

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

export function PlaylistsView({
  playlists,
  songs,
  onCreate,
  onRename,
  onDelete,
  onAddSong,
  onRemoveSong,
  onMoveSong,
  onAddBlock,
  onRenameBlock,
  onRemoveBlock,
  onMoveBlock,
  onAssignSong,
  onPlay,
  plan,
  onImportList,
  onImportPending,
  onDismissPlan,
}: {
  playlists: Playlist[];
  songs: Song[];
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onAddSong: (id: string, songId: string) => void;
  onRemoveSong: (id: string, songId: string) => void;
  onMoveSong: (id: string, songId: string, direction: -1 | 1) => void;
  onAddBlock: (id: string, name: string) => void;
  onRenameBlock: (id: string, blockId: string, name: string) => void;
  onRemoveBlock: (id: string, blockId: string) => void;
  onMoveBlock: (id: string, blockId: string, direction: -1 | 1) => void;
  onAssignSong: (id: string, songId: string, blockId: string | null) => void;
  onPlay: (id: string) => void;
  plan: { playlistId: string; entries: PlanEntry[] } | null;
  onImportList: (name: string, text: string) => void;
  onImportPending: (index: number) => void;
  onDismissPlan: () => void;
}) {
  const [name, setName] = useState("");
  const [listName, setListName] = useState("");
  const [listText, setListText] = useState("");
  const [blockNames, setBlockNames] = useState<Record<string, string>>({});
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const root = useRef<HTMLElement | null>(null);
  const pendingFocus = useRef<string[] | null>(null);
  const byId = new Map(songs.map((song) => [song.id, song]));

  // Devolve o foco ao controle que o usuário acabou de acionar: a lista é reordenada
  // e o elemento pode ser remontado ou ficar desabilitado no limite da lista.
  useEffect(() => {
    const wanted = pendingFocus.current;
    if (!wanted) return;
    pendingFocus.current = null;
    for (const id of wanted) {
      const element = root.current?.querySelector<HTMLElement>(
        `[data-focus="${id}"]`,
      );
      if (element && !(element as HTMLButtonElement).disabled) {
        element.focus();
        return;
      }
    }
  });

  function announce(message: string, focus?: string[]) {
    setAnnouncement(message);
    if (focus) pendingFocus.current = focus;
  }

  const closeDialog = () => setDialog(null);

  return (
    <section ref={root}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-soft">
        Biblioteca
      </p>
      <h1 className="mt-2 text-3xl font-black tracking-tight">Repertórios</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Monte listas de músicas na ordem em que serão tocadas e organize em
        blocos, como Abertura, Louvor ou Ceia. Serve para culto, evento, ensaio…
      </p>

      <p
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="playlist-announcer"
      >
        {announcement}
      </p>

      <form
        className="mt-6 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          onCreate(name);
          announce(`Repertório ${name.trim()} criado.`);
          setName("");
        }}
      >
        <div>
          <label htmlFor="playlist-name" className="text-sm font-semibold">
            Nome do repertório
          </label>
          <input
            id="playlist-name"
            data-focus="new-playlist"
            className={`mt-2 ${inputClass}`}
            placeholder="Ex.: Culto de domingo, Casamento, Ensaio"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <button type="submit" className={primaryButton} disabled={!name.trim()}>
          <Plus size={16} aria-hidden /> Criar repertório
        </button>
      </form>

      <details
        className="mt-4 rounded-2xl border border-white/10 p-4"
        open={Boolean(plan)}
      >
        <summary className="cursor-pointer py-3 text-sm font-semibold">
          Importar lista de músicas
        </summary>
        <form
          className="mt-3 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!listText.trim()) return;
            onImportList(listName, listText);
            setListName("");
            setListText("");
          }}
        >
          <div>
            <label htmlFor="list-name" className="text-sm font-semibold">
              Nome do novo repertório
            </label>
            <input
              id="list-name"
              className={`mt-2 ${inputClass}`}
              value={listName}
              onChange={(event) => setListName(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="list-text" className="text-sm font-semibold">
              Lista de músicas
            </label>
            <textarea
              id="list-text"
              className="mt-2 min-h-36 w-full rounded-xl border border-control-border bg-control-background p-3 text-sm text-foreground outline-none placeholder:text-control-placeholder focus:border-brand/50"
              placeholder={
                "Uma música por linha\nTua Graça - Banda Exemplo\nBeta"
              }
              value={listText}
              onChange={(event) => setListText(event.target.value)}
            />
          </div>
          <button
            type="submit"
            className={primaryButton}
            disabled={!listText.trim()}
          >
            Criar repertório da lista
          </button>
        </form>
      </details>

      {plan ? (
        <section
          className="mt-4 rounded-2xl border border-white/10 bg-surface p-4"
          aria-label="Resultado da importação da lista"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold" role="status">
              {plan.entries.filter((entry) => entry.songId).length} de{" "}
              {plan.entries.length} músicas já estão na biblioteca.
            </p>
            <button
              type="button"
              className={secondaryButton}
              onClick={onDismissPlan}
            >
              Fechar resultado
            </button>
          </div>
          {plan.entries.some((entry) => !entry.songId) ? (
            <ul className="mt-3 space-y-2" aria-label="Fila de importação">
              {plan.entries.map((entry, index) =>
                entry.songId ? null : (
                  <li
                    key={`${entry.title}-${index}`}
                    className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {entry.title}
                      {entry.artist ? ` (${entry.artist})` : ""}
                    </span>
                    <button
                      type="button"
                      className={primaryButton}
                      onClick={() => onImportPending(index)}
                    >
                      Importar cifra de {entry.title}
                    </button>
                  </li>
                ),
              )}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">
              Todas as músicas da lista estão no repertório.
            </p>
          )}
        </section>
      ) : null}

      {playlists.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/15 p-8 text-center">
          <ListMusic size={28} className="text-muted" aria-hidden />
          <p className="text-sm font-semibold">
            Nenhum repertório ainda. Crie o primeiro acima.
          </p>
          <p className="max-w-sm text-sm text-muted">
            Dê um nome, adicione músicas e, se quiser, separe em blocos.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {playlists.map((playlist) => {
            const items = playlist.songIds
              .map((id) => byId.get(id))
              .filter((song): song is Song => Boolean(song));
            const available = songs.filter(
              (song) => !playlist.songIds.includes(song.id),
            );
            const blocks = playlist.blocks ?? [];
            let position = 0;
            return (
              <article
                key={playlist.id}
                className="rounded-3xl border border-white/10 bg-surface p-4 sm:p-5"
                aria-label={`Repertório ${playlist.name}`}
              >
                <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2
                      tabIndex={-1}
                      data-focus={`title-${playlist.id}`}
                      className="break-words text-xl font-bold outline-none"
                    >
                      {playlist.name}
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      {plural(items.length, "música", "músicas")}
                      {blocks.length
                        ? ` · ${plural(blocks.length, "bloco", "blocos")}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className={primaryButton}
                      disabled={items.length === 0}
                      onClick={() => onPlay(playlist.id)}
                    >
                      <Play size={15} aria-hidden /> Tocar repertório
                    </button>
                    <button
                      type="button"
                      className={secondaryButton}
                      onClick={() =>
                        setDialog({
                          kind: "rename-playlist",
                          id: playlist.id,
                          name: playlist.name,
                        })
                      }
                    >
                      <Pencil size={15} aria-hidden /> Renomear
                    </button>
                    <IconButton
                      label={`Excluir repertório ${playlist.name}`}
                      danger
                      onClick={() =>
                        setDialog({
                          kind: "delete-playlist",
                          id: playlist.id,
                          name: playlist.name,
                        })
                      }
                    >
                      <Trash2 size={17} aria-hidden />
                    </IconButton>
                  </div>
                </header>

                {items.length === 0 && blocks.length === 0 ? (
                  <p className="mt-5 rounded-2xl border border-dashed border-white/15 p-4 text-sm text-muted">
                    Este repertório está vazio. Adicione músicas abaixo.
                  </p>
                ) : (
                  <div className="mt-5 space-y-3">
                    {groupPlaylist(playlist).map((group) => {
                      const groupSongs = group.songIds
                        .map((id) => byId.get(id))
                        .filter((song): song is Song => Boolean(song));
                      const blockIndex = group.block
                        ? blocks.findIndex(
                            (block) => block.id === group.block?.id,
                          )
                        : -1;
                      const label = group.block
                        ? group.block.name
                        : "Sem bloco";
                      const blockId = group.block?.id ?? "";
                      const frame =
                        blocks.length === 0
                          ? ""
                          : group.block
                            ? "rounded-2xl border border-white/10 border-l-4 border-l-brand bg-panel/50 p-3"
                            : "rounded-2xl border border-dashed border-white/15 p-3";
                      return (
                        <section
                          key={group.block?.id ?? "loose"}
                          aria-label={
                            blocks.length > 0 ? `Bloco ${label}` : undefined
                          }
                          className={frame}
                        >
                          {blocks.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1">
                              <h3 className="flex min-w-0 basis-full items-baseline gap-2 sm:basis-0 sm:flex-1">
                                <span className="break-words text-sm font-bold uppercase tracking-[0.12em] text-brand-soft">
                                  {label}
                                </span>
                                <span className="shrink-0 text-xs text-muted">
                                  {plural(
                                    groupSongs.length,
                                    "música",
                                    "músicas",
                                  )}
                                </span>
                              </h3>
                              {group.block ? (
                                <>
                                  <IconButton
                                    label={`Subir bloco ${label}`}
                                    focusId={`block-up-${blockId}`}
                                    disabled={blockIndex === 0}
                                    onClick={() => {
                                      onMoveBlock(playlist.id, blockId, -1);
                                      announce(
                                        `Bloco ${label} movido para cima.`,
                                        [
                                          `block-up-${blockId}`,
                                          `block-down-${blockId}`,
                                        ],
                                      );
                                    }}
                                  >
                                    <ArrowUp size={16} aria-hidden />
                                  </IconButton>
                                  <IconButton
                                    label={`Descer bloco ${label}`}
                                    focusId={`block-down-${blockId}`}
                                    disabled={blockIndex === blocks.length - 1}
                                    onClick={() => {
                                      onMoveBlock(playlist.id, blockId, 1);
                                      announce(
                                        `Bloco ${label} movido para baixo.`,
                                        [
                                          `block-down-${blockId}`,
                                          `block-up-${blockId}`,
                                        ],
                                      );
                                    }}
                                  >
                                    <ArrowDown size={16} aria-hidden />
                                  </IconButton>
                                  <IconButton
                                    label={`Renomear bloco ${label}`}
                                    onClick={() =>
                                      setDialog({
                                        kind: "rename-block",
                                        id: playlist.id,
                                        blockId,
                                        name: label,
                                      })
                                    }
                                  >
                                    <Pencil size={16} aria-hidden />
                                  </IconButton>
                                  <IconButton
                                    label={`Excluir bloco ${label}`}
                                    danger
                                    onClick={() =>
                                      setDialog({
                                        kind: "delete-block",
                                        id: playlist.id,
                                        blockId,
                                        name: label,
                                      })
                                    }
                                  >
                                    <Trash2 size={16} aria-hidden />
                                  </IconButton>
                                </>
                              ) : null}
                            </div>
                          ) : null}
                          {groupSongs.length === 0 ? (
                            <p className="mt-2 text-sm text-muted">
                              Nenhuma música neste bloco. Em uma música, escolha
                              este bloco para movê-la para cá.
                            </p>
                          ) : (
                            <ol
                              className={
                                blocks.length > 0
                                  ? "mt-3 space-y-2"
                                  : "space-y-2"
                              }
                            >
                              {groupSongs.map((song, index) => {
                                position += 1;
                                return (
                                  <li
                                    key={song.id}
                                    className="rounded-xl border border-white/10 bg-background/60 p-3 text-sm"
                                  >
                                    <div className="flex items-start gap-3">
                                      <span
                                        className="mt-0.5 w-6 shrink-0 text-right tabular-nums text-muted"
                                        aria-hidden
                                      >
                                        {position}
                                      </span>
                                      <span className="min-w-0 flex-1 break-words font-medium">
                                        {song.title}
                                      </span>
                                    </div>
                                    <div className="mt-2 flex flex-wrap items-center gap-1 pl-9">
                                      {blocks.length > 0 ? (
                                        <div className="mr-auto flex items-center gap-2">
                                          <span
                                            className="text-xs text-muted"
                                            aria-hidden
                                          >
                                            Bloco
                                          </span>
                                          <label
                                            htmlFor={`block-${playlist.id}-${song.id}`}
                                            className="sr-only"
                                          >
                                            Bloco de {song.title}
                                          </label>
                                          <select
                                            id={`block-${playlist.id}-${song.id}`}
                                            className="h-11 min-w-0 rounded-lg border border-control-border bg-control-background px-2 text-sm text-foreground sm:h-9"
                                            value={group.block?.id ?? ""}
                                            onChange={(event) => {
                                              const next =
                                                event.target.value || null;
                                              onAssignSong(
                                                playlist.id,
                                                song.id,
                                                next,
                                              );
                                              announce(
                                                `${song.title} movida para ${next ? `o bloco ${blocks.find((block) => block.id === next)?.name ?? ""}` : "sem bloco"}.`,
                                              );
                                            }}
                                          >
                                            <option value="">Sem bloco</option>
                                            {blocks.map((block) => (
                                              <option
                                                key={block.id}
                                                value={block.id}
                                              >
                                                {block.name}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                      ) : null}
                                      <span className="ml-auto flex items-center gap-1">
                                        <IconButton
                                          label={`Subir ${song.title}`}
                                          focusId={`song-up-${song.id}`}
                                          disabled={index === 0}
                                          onClick={() => {
                                            onMoveSong(
                                              playlist.id,
                                              song.id,
                                              -1,
                                            );
                                            announce(
                                              `${song.title} movida para cima.`,
                                              [
                                                `song-up-${song.id}`,
                                                `song-down-${song.id}`,
                                              ],
                                            );
                                          }}
                                        >
                                          <ArrowUp size={16} aria-hidden />
                                        </IconButton>
                                        <IconButton
                                          label={`Descer ${song.title}`}
                                          focusId={`song-down-${song.id}`}
                                          disabled={
                                            index === groupSongs.length - 1
                                          }
                                          onClick={() => {
                                            onMoveSong(playlist.id, song.id, 1);
                                            announce(
                                              `${song.title} movida para baixo.`,
                                              [
                                                `song-down-${song.id}`,
                                                `song-up-${song.id}`,
                                              ],
                                            );
                                          }}
                                        >
                                          <ArrowDown size={16} aria-hidden />
                                        </IconButton>
                                        <IconButton
                                          label={`Remover ${song.title} do repertório`}
                                          danger
                                          onClick={() => {
                                            onRemoveSong(playlist.id, song.id);
                                            announce(
                                              `${song.title} removida do repertório ${playlist.name}.`,
                                              [`title-${playlist.id}`],
                                            );
                                          }}
                                        >
                                          <X size={16} aria-hidden />
                                        </IconButton>
                                      </span>
                                    </div>
                                  </li>
                                );
                              })}
                            </ol>
                          )}
                        </section>
                      );
                    })}
                  </div>
                )}

                <div className="mt-5 grid gap-4 border-t border-white/10 pt-4 lg:grid-cols-2">
                  <div>
                    <label
                      htmlFor={`add-${playlist.id}`}
                      className="text-sm font-semibold"
                    >
                      <span aria-hidden>Adicionar música</span>
                      <span className="sr-only">
                        Adicionar música a {playlist.name}
                      </span>
                    </label>
                    <select
                      id={`add-${playlist.id}`}
                      className={`mt-2 ${inputClass}`}
                      value=""
                      disabled={available.length === 0}
                      onChange={(event) => {
                        const songId = event.target.value;
                        if (!songId) return;
                        onAddSong(playlist.id, songId);
                        announce(
                          `${byId.get(songId)?.title ?? "Música"} adicionada ao repertório ${playlist.name}.`,
                        );
                      }}
                    >
                      <option value="">
                        {available.length === 0
                          ? "Todas as músicas já estão no repertório"
                          : "Escolha uma música…"}
                      </option>
                      {available.map((song) => (
                        <option key={song.id} value={song.id}>
                          {song.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      const blockName = blockNames[playlist.id] ?? "";
                      if (!blockName.trim()) return;
                      onAddBlock(playlist.id, blockName);
                      announce(`Bloco ${blockName.trim()} criado.`);
                      setBlockNames((state) => ({
                        ...state,
                        [playlist.id]: "",
                      }));
                    }}
                  >
                    <label
                      htmlFor={`block-name-${playlist.id}`}
                      className="text-sm font-semibold"
                    >
                      <span aria-hidden>Novo bloco</span>
                      <span className="sr-only">
                        Nome do novo bloco em {playlist.name}
                      </span>
                    </label>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                      <input
                        id={`block-name-${playlist.id}`}
                        className={inputClass}
                        placeholder="Ex.: Abertura, Louvor, Ceia"
                        value={blockNames[playlist.id] ?? ""}
                        onChange={(event) =>
                          setBlockNames((state) => ({
                            ...state,
                            [playlist.id]: event.target.value,
                          }))
                        }
                      />
                      <button
                        type="submit"
                        className={secondaryButton}
                        disabled={!(blockNames[playlist.id] ?? "").trim()}
                      >
                        <Plus size={15} aria-hidden /> Adicionar bloco
                      </button>
                    </div>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <TextDialog
        open={dialog?.kind === "rename-playlist"}
        title="Renomear repertório"
        label="Novo nome do repertório"
        initialValue={dialog?.kind === "rename-playlist" ? dialog.name : ""}
        confirmLabel="Salvar nome"
        onClose={closeDialog}
        onSubmit={(value) => {
          if (dialog?.kind !== "rename-playlist") return;
          onRename(dialog.id, value);
          announce(`Repertório renomeado para ${value.trim()}.`);
          closeDialog();
        }}
      />
      <TextDialog
        open={dialog?.kind === "rename-block"}
        title="Renomear bloco"
        label="Novo nome do bloco"
        initialValue={dialog?.kind === "rename-block" ? dialog.name : ""}
        confirmLabel="Salvar nome"
        onClose={closeDialog}
        onSubmit={(value) => {
          if (dialog?.kind !== "rename-block") return;
          onRenameBlock(dialog.id, dialog.blockId, value);
          announce(`Bloco renomeado para ${value.trim()}.`);
          closeDialog();
        }}
      />
      <ConfirmDialog
        open={dialog?.kind === "delete-playlist"}
        title={`Excluir o repertório "${dialog?.kind === "delete-playlist" ? dialog.name : ""}"?`}
        description="As músicas continuam na biblioteca. Só o repertório e seus blocos são removidos."
        confirmLabel="Excluir repertório"
        onClose={closeDialog}
        onConfirm={() => {
          if (dialog?.kind !== "delete-playlist") return;
          onDelete(dialog.id);
          announce(`Repertório ${dialog.name} excluído.`, ["new-playlist"]);
          closeDialog();
        }}
      />
      <ConfirmDialog
        open={dialog?.kind === "delete-block"}
        title={`Excluir o bloco "${dialog?.kind === "delete-block" ? dialog.name : ""}"?`}
        description="As músicas continuam no repertório, sem bloco."
        confirmLabel="Excluir bloco"
        onClose={closeDialog}
        onConfirm={() => {
          if (dialog?.kind !== "delete-block") return;
          onRemoveBlock(dialog.id, dialog.blockId);
          announce(
            `Bloco ${dialog.name} excluído. As músicas continuam no repertório.`,
            [`title-${dialog.id}`],
          );
          closeDialog();
        }}
      />
    </section>
  );
}
