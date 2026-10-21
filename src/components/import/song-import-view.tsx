"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SongSections } from "@/components/song/song-sections";
import {
  type ChordSheetDraft,
  parseChordSheet,
} from "@/domain/songs/chord-sheet";
import { WebSearchPanel } from "./web-search-panel";

export type ImportFields = {
  text: string;
  title?: string;
  artist?: string;
  key?: string;
};

export type ImportValues = { title: string; artist: string; key: string };

const inputClass =
  "h-11 w-full rounded-xl border border-control-border bg-control-background px-3 text-sm sm:h-10 text-foreground outline-none placeholder:text-control-placeholder focus:border-brand/50 focus:bg-control-background-hover";

export function SongImportView({
  fields,
  onChange,
  onSave,
  onDiscard,
}: {
  fields: ImportFields;
  onChange: (patch: Partial<ImportFields>) => void;
  onSave: (draft: ChordSheetDraft, values: ImportValues) => void;
  onDiscard: () => void;
}) {
  const parsed = useMemo(() => parseChordSheet(fields.text), [fields.text]);
  const title = fields.title ?? parsed.title ?? "";
  const artist = fields.artist ?? parsed.artist ?? "";
  const key = fields.key ?? parsed.key ?? "";
  const hasContent = parsed.sections.length > 0;
  const canSave = hasContent && title.trim().length > 0;
  const reviewRef = useRef<HTMLHeadingElement | null>(null);
  const [importedCount, setImportedCount] = useState(0);

  // Depois de importar da internet, leva o foco para a revisão: o leitor de tela
  // anuncia o cabeçalho e quem usa o teclado segue direto para os campos.
  useEffect(() => {
    if (importedCount > 0) reviewRef.current?.focus();
  }, [importedCount]);

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-soft">
        Importação
      </p>
      <h1 className="mt-2 text-3xl font-black tracking-tight">
        Importar cifra colada
      </h1>
      <p className="mt-2 text-sm text-muted">
        Busque na internet ou cole a cifra, confira o resultado e salve na
        biblioteca.
      </p>

      <div className="mt-6">
        <WebSearchPanel
          onImported={(result) => {
            onChange({
              text: result.text,
              title: result.title,
              artist: result.artist ?? "",
              key: result.key ?? "",
            });
            setImportedCount((count) => count + 1);
          }}
        />
      </div>

      <h2
        ref={reviewRef}
        tabIndex={-1}
        className="mt-8 text-lg font-bold outline-none"
      >
        Revise e salve
      </h2>
      <p className="mt-1 text-sm text-muted">
        Cole a cifra aqui ou ajuste o que veio da busca. A prévia mostra como
        ela vai ficar no player.
      </p>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label htmlFor="import-text" className="text-sm font-semibold">
              Texto da cifra
            </label>
            <textarea
              id="import-text"
              className="mt-2 min-h-72 w-full rounded-xl border border-control-border bg-control-background p-3 font-mono text-sm text-foreground outline-none placeholder:text-control-placeholder focus:border-brand/50"
              placeholder={"[Refrão]\nC        G\nCante comigo"}
              value={fields.text}
              onChange={(event) => onChange({ text: event.target.value })}
              spellCheck={false}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label htmlFor="import-title" className="text-sm font-semibold">
                Título
              </label>
              <input
                id="import-title"
                aria-required="true"
                autoComplete="off"
                className={`mt-2 ${inputClass}`}
                value={title}
                onChange={(event) => onChange({ title: event.target.value })}
              />
            </div>
            <div>
              <label htmlFor="import-artist" className="text-sm font-semibold">
                Artista
              </label>
              <input
                id="import-artist"
                className={`mt-2 ${inputClass}`}
                value={artist}
                onChange={(event) => onChange({ artist: event.target.value })}
              />
            </div>
            <div>
              <label htmlFor="import-key" className="text-sm font-semibold">
                Tom
              </label>
              <input
                id="import-key"
                placeholder="Ex.: G, Am"
                autoComplete="off"
                className={`mt-2 ${inputClass}`}
                value={key}
                onChange={(event) => onChange({ key: event.target.value })}
              />
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold">Prévia</p>
          <p className="mt-1 text-xs text-muted" role="note">
            Rascunho gerado automaticamente. Revise antes de salvar.
          </p>
          <section
            className="mt-2 space-y-8 rounded-3xl border border-white/10 bg-surface p-5"
            aria-label="Prévia da cifra"
          >
            {hasContent ? (
              <SongSections
                sections={parsed.sections}
                idPrefix="import-section-"
              />
            ) : (
              <p className="text-sm text-muted">
                A prévia aparece aqui quando você colar a cifra.
              </p>
            )}
          </section>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 mt-6 flex flex-wrap items-center gap-2 border-t border-white/10 bg-background/95 py-3 backdrop-blur">
        <button
          type="button"
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-10 sm:flex-none"
          disabled={!canSave}
          onClick={() => onSave(parsed, { title, artist, key })}
        >
          Salvar na biblioteca
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-control-border px-4 py-2 text-sm font-semibold hover:bg-control-background-hover sm:min-h-10"
          onClick={onDiscard}
        >
          Descartar
        </button>
        {hasContent && !title.trim() ? (
          <p className="w-full text-xs text-muted sm:w-auto" role="status">
            Informe o título para salvar.
          </p>
        ) : null}
      </div>
    </section>
  );
}
