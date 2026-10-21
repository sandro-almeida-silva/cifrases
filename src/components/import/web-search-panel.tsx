"use client";

import { Check, CircleDashed, Loader2, Search, X } from "lucide-react";
import { type FormEvent, useState } from "react";
import { parseChordSheet } from "@/domain/songs/chord-sheet";
import {
  type ExtractedChordPage,
  type ImportStep,
  initialSteps,
  updateStep,
  type WebSearchResult,
} from "@/domain/songs/web-import";

export type WebImportResult = {
  text: string;
  title: string;
  artist?: string;
  key?: string;
};

const inputClass =
  "h-10 w-full rounded-xl border border-control-border bg-control-background px-3 text-sm text-foreground outline-none placeholder:text-control-placeholder focus:border-brand/50 focus:bg-control-background-hover";

type FetchError = { step?: "fetch" | "extract"; error?: string };

async function readJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function StepIcon({ status }: { status: ImportStep["status"] }) {
  if (status === "running")
    return (
      <Loader2 className="size-4 animate-spin text-brand-soft" aria-hidden />
    );
  if (status === "done")
    return <Check className="size-4 text-green-500" aria-hidden />;
  if (status === "failed")
    return <X className="size-4 text-red-500" aria-hidden />;
  return <CircleDashed className="size-4 text-muted" aria-hidden />;
}

const STATUS_TEXT: Record<ImportStep["status"], string> = {
  pending: "Aguardando",
  running: "Em andamento",
  done: "Concluída",
  failed: "Falhou",
};

export function WebSearchPanel({
  onImported,
}: {
  onImported: (result: WebImportResult) => void;
}) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<WebSearchResult[] | null>(null);
  const [steps, setSteps] = useState<ImportStep[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [chosen, setChosen] = useState<WebSearchResult | null>(null);

  async function search(event?: FormEvent) {
    event?.preventDefault();
    const query = term.trim();
    if (query.length < 2 || busy) return;
    setBusy(true);
    setChosen(null);
    setResults(null);
    setSteps(
      updateStep(initialSteps(), "search", {
        status: "running",
        message: `Procurando “${query}”…`,
      }),
    );
    try {
      const response = await fetch(
        `/api/import/search?q=${encodeURIComponent(query)}`,
      );
      const body = await readJson<{
        results?: WebSearchResult[];
        error?: string;
      }>(response);
      if (!response.ok || !body?.results) {
        throw new Error(body?.error ?? "Falha ao buscar.");
      }
      setResults(body.results);
      setSteps((state) =>
        updateStep(state ?? initialSteps(), "search", {
          status: "done",
          message: body.results?.length
            ? `${body.results.length} resultado(s) encontrado(s). Escolha um para importar.`
            : "Nenhum resultado encontrado. Tente outro termo ou cole a cifra manualmente.",
        }),
      );
    } catch (error) {
      setSteps((state) =>
        updateStep(state ?? initialSteps(), "search", {
          status: "failed",
          message: error instanceof Error ? error.message : "Falha ao buscar.",
        }),
      );
    } finally {
      setBusy(false);
    }
  }

  async function choose(result: WebSearchResult) {
    if (busy) return;
    setBusy(true);
    setChosen(result);
    let next = updateStep(steps ?? initialSteps(), "fetch", {
      status: "running",
      message: result.url,
    });
    next = updateStep(next, "extract", { status: "pending" });
    next = updateStep(next, "draft", { status: "pending" });
    setSteps(next);
    try {
      let response: Response;
      try {
        response = await fetch(
          `/api/import/fetch?url=${encodeURIComponent(result.url)}`,
        );
      } catch {
        throw Object.assign(new Error("Sem conexão com o servidor."), {
          step: "fetch" as const,
        });
      }
      const body = await readJson<(ExtractedChordPage & FetchError) | null>(
        response,
      );
      if (!response.ok || !body || !("text" in body)) {
        throw Object.assign(
          new Error(body?.error ?? "Falha ao baixar a página."),
          { step: body?.step ?? "fetch" },
        );
      }
      next = updateStep(next, "fetch", {
        status: "done",
        message: "Página baixada.",
      });
      const lineCount = body.text.split("\n").length;
      next = updateStep(next, "extract", {
        status: "done",
        message: `Cifra extraída (${lineCount} linhas).`,
      });
      next = updateStep(next, "draft", {
        status: "running",
        message: "Interpretando acordes e seções…",
      });
      setSteps(next);

      const draft = parseChordSheet(body.text);
      const lines = draft.sections.flatMap((section) => section.lines);
      const chords = lines.reduce(
        (total, item) => total + (item.chords?.length ?? 0),
        0,
      );
      if (!draft.sections.length) {
        throw Object.assign(
          new Error("Não consegui interpretar a cifra baixada."),
          { step: "draft" as const },
        );
      }
      setSteps(
        updateStep(next, "draft", {
          status: "done",
          message: `${draft.sections.length} seção(ões), ${lines.length} linha(s), ${chords} acorde(s). Revise abaixo antes de salvar.`,
        }),
      );
      onImported({
        text: body.text,
        title: body.title || result.title,
        ...((body.artist ?? result.artist)
          ? { artist: (body.artist ?? result.artist) as string }
          : {}),
        ...(body.key ? { key: body.key } : {}),
      });
    } catch (error) {
      const failedStep = (error as { step?: ImportStep["id"] }).step ?? "fetch";
      const message =
        error instanceof Error ? error.message : "Falha na importação.";
      if (failedStep === "extract" || failedStep === "draft") {
        next = updateStep(next, "fetch", {
          status: "done",
          message: "Página baixada.",
        });
      }
      setSteps(updateStep(next, failedStep, { status: "failed", message }));
    } finally {
      setBusy(false);
    }
  }

  const failed = steps?.some((step) => step.status === "failed") ?? false;

  return (
    <section
      aria-label="Buscar cifra na internet"
      className="rounded-3xl border border-white/10 bg-surface p-5"
    >
      <h2 className="text-lg font-bold">Buscar na internet</h2>
      <p className="mt-1 text-sm text-muted">
        Pesquise por música ou artista, escolha o resultado e a cifra é
        importada para revisão.
      </p>

      <form className="mt-4 flex gap-2" onSubmit={search}>
        <div className="min-w-0 flex-1">
          <label htmlFor="web-search-term" className="sr-only">
            Buscar cifra
          </label>
          <input
            id="web-search-term"
            className={inputClass}
            type="search"
            placeholder="Ex.: evidências chitãozinho"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            disabled={busy}
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={busy || term.trim().length < 2}
        >
          <Search className="size-4" aria-hidden /> Buscar
        </button>
      </form>

      {results?.length ? (
        <ul className="mt-4 space-y-2" aria-label="Resultados da busca">
          {results.map((item) => (
            <li key={item.url}>
              <button
                type="button"
                className="flex w-full flex-col rounded-xl border border-control-border px-3 py-2 text-left hover:bg-control-background-hover disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => choose(item)}
                disabled={busy}
                aria-label={`Importar ${item.title}${item.artist ? ` — ${item.artist}` : ""}`}
              >
                <span className="text-sm font-semibold">{item.title}</span>
                {item.artist ? (
                  <span className="text-xs text-muted">{item.artist}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {steps ? (
        <div className="mt-4" aria-live="polite">
          <p className="text-sm font-semibold">Progresso da importação</p>
          <ol className="mt-2 space-y-2" aria-label="Etapas da importação">
            {steps.map((step) => (
              <li
                key={step.id}
                className="flex items-start gap-2 text-sm"
                data-status={step.status}
              >
                <span className="mt-0.5">
                  <StepIcon status={step.status} />
                </span>
                <span>
                  <span className="font-medium">{step.label}</span>
                  <span className="sr-only"> — {STATUS_TEXT[step.status]}</span>
                  {step.message ? (
                    <span
                      className={`block text-xs ${step.status === "failed" ? "text-red-500" : "text-muted"}`}
                    >
                      {step.message}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ol>
          {failed ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="rounded-xl border border-control-border px-3 py-1.5 text-sm hover:bg-control-background-hover"
                onClick={() => (chosen ? choose(chosen) : search())}
                disabled={busy}
              >
                Tentar novamente
              </button>
              <span className="text-xs text-muted">
                Ou cole a cifra manualmente abaixo.
              </span>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
