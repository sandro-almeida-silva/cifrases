import { NextResponse } from "next/server";
import {
  extractChordPage,
  isAllowedImportUrl,
} from "@/domain/songs/web-import";

export const dynamic = "force-dynamic";

const TIMEOUT_MS = 10_000;
const MAX_BYTES = 2_000_000;

function failure(step: "fetch" | "extract", error: string, status: number) {
  return NextResponse.json({ step, error }, { status });
}

export async function GET(request: Request) {
  const target = new URL(request.url).searchParams.get("url") ?? "";
  if (!isAllowedImportUrl(target)) {
    return failure("fetch", "Endereço não permitido para importação.", 400);
  }

  let html: string;
  try {
    const response = await fetch(target, {
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; Cifrases/1.0)",
        accept: "text/html",
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!isAllowedImportUrl(response.url || target)) {
      return failure(
        "fetch",
        "A página foi redirecionada para um endereço não permitido.",
        400,
      );
    }
    if (!response.ok) {
      return failure(
        "fetch",
        `A página respondeu com erro ${response.status}.`,
        502,
      );
    }
    html = await response.text();
  } catch (error) {
    const timedOut =
      error instanceof DOMException && error.name === "TimeoutError";
    return failure(
      "fetch",
      timedOut
        ? "A página demorou demais para responder."
        : "Não foi possível baixar a página.",
      504,
    );
  }

  if (html.length > MAX_BYTES) {
    return failure("fetch", "A página é grande demais para importar.", 413);
  }
  const page = extractChordPage(html);
  if (!page) {
    return failure("extract", "Não encontrei uma cifra nessa página.", 422);
  }
  return NextResponse.json({ ...page, sourceUrl: target });
}
