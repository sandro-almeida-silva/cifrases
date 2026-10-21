"use client";

import {
  ArrowDown,
  ArrowUp,
  Pencil,
  Play,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import type { PlanEntry } from "@/domain/songs/playlist-import";
import { groupPlaylist, type Playlist } from "@/domain/songs/playlists";
import type { Song } from "@/domain/songs/types";

const inputClass =
  "h-10 w-full rounded-xl border border-control-border bg-control-background px-3 text-sm text-foreground outline-none placeholder:text-control-placeholder focus:border-brand/50 focus:bg-control-background-hover";

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
  const byId = new Map(songs.map((song) => [song.id, song]));

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-soft">
        Biblioteca
      </p>
      <h1 className="mt-2 text-3xl font-black tracking-tight">Repertórios</h1>
      <p className="mt-2 text-sm text-muted">
        Monte listas de músicas na ordem em que serão tocadas.
      </p>

      <form
        className="mt-6 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          onCreate(name);
          setName("");
        }}
      >
        <label htmlFor="playlist-name" className="sr-only">
          Nome do repertório
        </label>
        <input
          id="playlist-name"
          className={inputClass}
          placeholder="Nome do repertório"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <button
          type="submit"
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          disabled={!name.trim()}
        >
          Criar repertório
        </button>
      </form>

      <details
        className="mt-4 rounded-2xl border border-white/10 p-4"
        open={Boolean(plan)}
      >
        <summary className="cursor-pointer text-sm font-semibold">
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
              className="mt-2 min-h-32 w-full rounded-xl border border-control-border bg-control-background p-3 text-sm text-foreground outline-none placeholder:text-control-placeholder focus:border-brand/50"
              placeholder={
                "Uma música por linha\nTua Graça - Banda Exemplo\nBeta"
              }
              value={listText}
              onChange={(event) => setListText(event.target.value)}
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
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
              className="rounded-xl border border-white/10 px-3 py-1.5 text-sm"
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
                      className="rounded-xl bg-brand px-3 py-1.5 text-white"
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
        <p className="mt-8 rounded-2xl border border-dashed border-white/10 p-6 text-sm text-muted">
          Nenhum repertório ainda. Crie o primeiro acima.
        </p>
      ) : (
        <div className="mt-6 space-y-5">
          {playlists.map((playlist) => {
            const items = playlist.songIds
              .map((id) => byId.get(id))
              .filter((song): song is Song => Boolean(song));
            const available = songs.filter(
              (song) => !playlist.songIds.includes(song.id),
            );
            return (
              <article
                key={playlist.id}
                className="rounded-3xl border border-white/10 bg-surface p-5"
                aria-label={`Repertório ${playlist.name}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-bold">{playlist.name}</h2>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      disabled={items.length === 0}
                      onClick={() => onPlay(playlist.id)}
                    >
                      <Play size={14} /> Tocar repertório
                    </button>
                    <button
                      type="button"
                      className="rounded-xl border border-white/10 px-3 py-2 text-sm"
                      onClick={() => {
                        const next = window.prompt(
                          "Novo nome do repertório",
                          playlist.name,
                        );
                        if (next !== null) onRename(playlist.id, next);
                      }}
                    >
                      Renomear
                    </button>
                    <button
                      type="button"
                      className="rounded-xl border border-white/10 p-2 text-muted hover:text-red-200"
                      aria-label={`Excluir repertório ${playlist.name}`}
                      onClick={() => onDelete(playlist.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {items.length === 0 && !playlist.blocks?.length ? (
                  <p className="mt-4 text-sm text-muted">
                    Este repertório está vazio. Adicione músicas abaixo.
                  </p>
                ) : (
                  <div className="mt-4 space-y-4">
                    {(() => {
                      let position = 0;
                      const blocks = playlist.blocks ?? [];
                      return groupPlaylist(playlist).map((group) => {
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
                        return (
                          <section
                            key={group.block?.id ?? "loose"}
                            aria-label={
                              blocks.length > 0 ? `Bloco ${label}` : undefined
                            }
                          >
                            {blocks.length > 0 ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="min-w-0 flex-1 truncate text-sm font-bold uppercase tracking-[0.12em] text-brand-soft">
                                  {label}
                                </h3>
                                {group.block ? (
                                  <>
                                    <button
                                      type="button"
                                      className="rounded-lg p-1.5 hover:bg-white/5 disabled:opacity-30"
                                      aria-label={`Subir bloco ${label}`}
                                      disabled={blockIndex === 0}
                                      onClick={() =>
                                        onMoveBlock(
                                          playlist.id,
                                          group.block?.id ?? "",
                                          -1,
                                        )
                                      }
                                    >
                                      <ArrowUp size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      className="rounded-lg p-1.5 hover:bg-white/5 disabled:opacity-30"
                                      aria-label={`Descer bloco ${label}`}
                                      disabled={
                                        blockIndex === blocks.length - 1
                                      }
                                      onClick={() =>
                                        onMoveBlock(
                                          playlist.id,
                                          group.block?.id ?? "",
                                          1,
                                        )
                                      }
                                    >
                                      <ArrowDown size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      className="rounded-lg p-1.5 hover:bg-white/5"
                                      aria-label={`Renomear bloco ${label}`}
                                      onClick={() => {
                                        const next = window.prompt(
                                          "Novo nome do bloco",
                                          label,
                                        );
                                        if (next !== null)
                                          onRenameBlock(
                                            playlist.id,
                                            group.block?.id ?? "",
                                            next,
                                          );
                                      }}
                                    >
                                      <Pencil size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      className="rounded-lg p-1.5 text-muted hover:text-red-200"
                                      aria-label={`Excluir bloco ${label}`}
                                      onClick={() =>
                                        onRemoveBlock(
                                          playlist.id,
                                          group.block?.id ?? "",
                                        )
                                      }
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </>
                                ) : null}
                              </div>
                            ) : null}
                            {groupSongs.length === 0 ? (
                              <p className="mt-2 text-sm text-muted">
                                Nenhuma música neste bloco. Use “Bloco” em uma
                                música para movê-la para cá.
                              </p>
                            ) : (
                              <ol className="mt-2 space-y-2">
                                {groupSongs.map((song, index) => {
                                  position += 1;
                                  return (
                                    <li
                                      key={song.id}
                                      className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm"
                                    >
                                      <span className="w-6 text-muted">
                                        {position}.
                                      </span>
                                      <span className="min-w-0 flex-1 truncate font-medium">
                                        {song.title}
                                      </span>
                                      {blocks.length > 0 ? (
                                        <>
                                          <label
                                            htmlFor={`block-${playlist.id}-${song.id}`}
                                            className="sr-only"
                                          >
                                            Bloco de {song.title}
                                          </label>
                                          <select
                                            id={`block-${playlist.id}-${song.id}`}
                                            className="h-8 rounded-lg border border-control-border bg-control-background px-2 text-xs text-foreground"
                                            value={group.block?.id ?? ""}
                                            onChange={(event) =>
                                              onAssignSong(
                                                playlist.id,
                                                song.id,
                                                event.target.value || null,
                                              )
                                            }
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
                                        </>
                                      ) : null}
                                      <button
                                        type="button"
                                        className="rounded-lg p-1.5 hover:bg-white/5 disabled:opacity-30"
                                        aria-label={`Subir ${song.title}`}
                                        disabled={index === 0}
                                        onClick={() =>
                                          onMoveSong(playlist.id, song.id, -1)
                                        }
                                      >
                                        <ArrowUp size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        className="rounded-lg p-1.5 hover:bg-white/5 disabled:opacity-30"
                                        aria-label={`Descer ${song.title}`}
                                        disabled={
                                          index === groupSongs.length - 1
                                        }
                                        onClick={() =>
                                          onMoveSong(playlist.id, song.id, 1)
                                        }
                                      >
                                        <ArrowDown size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        className="rounded-lg p-1.5 hover:bg-white/5"
                                        aria-label={`Remover ${song.title} do repertório`}
                                        onClick={() =>
                                          onRemoveSong(playlist.id, song.id)
                                        }
                                      >
                                        <X size={14} />
                                      </button>
                                    </li>
                                  );
                                })}
                              </ol>
                            )}
                          </section>
                        );
                      });
                    })()}
                  </div>
                )}

                <form
                  className="mt-4 flex flex-col gap-2 sm:flex-row"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const blockName = blockNames[playlist.id] ?? "";
                    if (!blockName.trim()) return;
                    onAddBlock(playlist.id, blockName);
                    setBlockNames((state) => ({ ...state, [playlist.id]: "" }));
                  }}
                >
                  <label
                    htmlFor={`block-name-${playlist.id}`}
                    className="sr-only"
                  >
                    Nome do novo bloco em {playlist.name}
                  </label>
                  <input
                    id={`block-name-${playlist.id}`}
                    className={inputClass}
                    placeholder="Novo bloco (ex.: Abertura, Louvor, Ceia)"
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
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold disabled:opacity-50"
                    disabled={!(blockNames[playlist.id] ?? "").trim()}
                  >
                    <Plus size={14} /> Adicionar bloco
                  </button>
                </form>

                <div className="mt-4">
                  <label htmlFor={`add-${playlist.id}`} className="sr-only">
                    Adicionar música a {playlist.name}
                  </label>
                  <select
                    id={`add-${playlist.id}`}
                    className={inputClass}
                    value=""
                    disabled={available.length === 0}
                    onChange={(event) => {
                      if (event.target.value)
                        onAddSong(playlist.id, event.target.value);
                    }}
                  >
                    <option value="">
                      {available.length === 0
                        ? "Todas as músicas já estão no repertório"
                        : "Adicionar música..."}
                    </option>
                    {available.map((song) => (
                      <option key={song.id} value={song.id}>
                        {song.title}
                      </option>
                    ))}
                  </select>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
