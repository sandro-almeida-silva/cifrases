import { NextResponse } from "next/server";
import { parseSearchResults } from "@/domain/songs/web-import";

export const dynamic = "force-dynamic";

const SEARCH_URL = "https://html.duckduckgo.com/html/";
const TIMEOUT_MS = 10_000;

export async function GET(request: Request) {
  const term = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (term.length < 2) {
    return NextResponse.json(
      { error: "Digite pelo menos 2 caracteres para buscar." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `${SEARCH_URL}?q=${encodeURIComponent(`site:cifraclub.com.br ${term}`)}`,
      {
        headers: {
          "user-agent": "Mozilla/5.0 (compatible; Cifrases/1.0)",
          accept: "text/html",
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      },
    );
    if (!response.ok) {
      return NextResponse.json(
        { error: `A busca respondeu com erro ${response.status}.` },
        { status: 502 },
      );
    }
    return NextResponse.json({
      results: parseSearchResults(await response.text()),
    });
  } catch (error) {
    const timedOut =
      error instanceof DOMException && error.name === "TimeoutError";
    return NextResponse.json(
      {
        error: timedOut
          ? "A busca demorou demais para responder."
          : "Não foi possível acessar o serviço de busca.",
      },
      { status: 504 },
    );
  }
}
