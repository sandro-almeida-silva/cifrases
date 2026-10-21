export type ImportStepId = "search" | "fetch" | "extract" | "draft";
export type ImportStepStatus = "pending" | "running" | "done" | "failed";

export type ImportStep = {
  id: ImportStepId;
  label: string;
  status: ImportStepStatus;
  message?: string;
};

export type WebSearchResult = { title: string; artist?: string; url: string };

export type ExtractedChordPage = {
  title: string;
  artist?: string;
  key?: string;
  text: string;
};

const STEP_LABELS: Record<ImportStepId, string> = {
  search: "Buscando na internet",
  fetch: "Baixando a página da cifra",
  extract: "Extraindo a cifra",
  draft: "Montando o rascunho",
};

export function initialSteps(): ImportStep[] {
  return (Object.keys(STEP_LABELS) as ImportStepId[]).map((id) => ({
    id,
    label: STEP_LABELS[id],
    status: "pending",
  }));
}

export function updateStep(
  steps: ImportStep[],
  id: ImportStepId,
  patch: Partial<Omit<ImportStep, "id" | "label">>,
) {
  return steps.map((step) => (step.id === id ? { ...step, ...patch } : step));
}

const ALLOWED_HOSTS = new Set(["www.cifraclub.com.br", "cifraclub.com.br"]);

/** Só páginas de música (/artista/musica/) de hosts permitidos; evita SSRF. */
export function isAllowedImportUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port)
    return false;
  if (!ALLOWED_HOSTS.has(url.hostname)) return false;
  return url.pathname.split("/").filter(Boolean).length === 2;
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(value: string) {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, code: string) => {
    if (code.startsWith("#x") || code.startsWith("#X"))
      return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
    if (code.startsWith("#"))
      return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

function stripTags(value: string) {
  return decodeEntities(value.replace(/<[^>]*>/g, "")).trim();
}

function cleanTitle(raw: string) {
  const parts = raw
    .replace(/\s*\((?:cifra|letra|tab)[^)]*\)/gi, "")
    .split(/\s+[-–—]\s+/)
    .map((part) => part.trim())
    .filter((part) => part && !/^cifra club$/i.test(part));
  return { title: parts[0] ?? "", artist: parts[1] };
}

export function parseSearchResults(html: string): WebSearchResult[] {
  const results: WebSearchResult[] = [];
  const seen = new Set<string>();
  for (const match of html.matchAll(
    /<a\b[^>]*class="[^"]*result__a[^"]*"[^>]*>[\s\S]*?<\/a>/gi,
  )) {
    const anchor = match[0];
    const href = /href="([^"]+)"/i.exec(anchor)?.[1];
    if (!href) continue;
    const decoded = decodeEntities(href);
    const target =
      new URL(decoded, "https://duckduckgo.com").searchParams.get("uddg") ??
      decoded;
    if (!isAllowedImportUrl(target) || seen.has(target)) continue;
    const { title, artist } = cleanTitle(stripTags(anchor));
    if (!title) continue;
    seen.add(target);
    results.push({ title, ...(artist ? { artist } : {}), url: target });
  }
  return results;
}

export function extractChordPage(html: string): ExtractedChordPage | null {
  const pre = /<pre\b[^>]*>([\s\S]*?)<\/pre>/i.exec(html)?.[1];
  if (!pre) return null;
  const text = decodeEntities(pre.replace(/<[^>]*>/g, ""))
    .replace(/\r\n?/g, "\n")
    .trim();
  if (!text) return null;
  const title = stripTags(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1] ?? "");
  const artist = stripTags(
    /<h2\b[^>]*>([\s\S]*?)<\/h2>/i.exec(html)?.[1] ?? "",
  );
  const key = stripTags(
    /id="cifra_tom"[^>]*>([\s\S]*?)<\/span>/i.exec(html)?.[1] ?? "",
  );
  return {
    title,
    ...(artist ? { artist } : {}),
    ...(key ? { key } : {}),
    text,
  };
}
