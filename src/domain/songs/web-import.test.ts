import { describe, expect, it } from "vitest";
import { parseChordSheet } from "./chord-sheet";
import {
  extractChordPage,
  type ImportStepId,
  initialSteps,
  isAllowedImportUrl,
  parseSearchResults,
  updateStep,
} from "./web-import";

const searchHtml = `
<div class="result"><a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.cifraclub.com.br%2Fchitaozinho-e-xororo%2Fevidencias%2F&amp;rut=abc">Evidências - Chitãozinho &amp; Xororó (cifra) - Cifra Club</a></div>
<div class="result"><a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.cifraclub.com.br%2Fchitaozinho-e-xororo%2F&amp;rut=abc">Chitãozinho &amp; Xororó - Cifra Club</a></div>
<div class="result"><a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexemplo.com%2Fa%2Fb%2F">Outro site</a></div>
<div class="result"><a class="result__a" href="https://www.cifraclub.com.br/legiao-urbana/pais-e-filhos/">Pais e Filhos - Legião Urbana - Cifra Club</a></div>
<div class="result"><a class="result__a" href="https://www.cifraclub.com.br/legiao-urbana/pais-e-filhos/">Duplicado</a></div>
`;

const songHtml = `
<html><body>
<h1 class="t1">Evidências</h1>
<h2 class="t3"><a href="/chitaozinho-e-xororo/">Chitãozinho &amp; Xororó</a></h2>
<span id="cifra_tom"><a href="#">G</a></span>
<pre><span class="tablatura"></span>[Primeira Parte]
<b>G</b>        <b>D/F#</b>
Quando eu digo que deixei de te amar
<b>Em</b>
É porque eu te amo &amp; quero
</pre>
</body></html>`;

describe("isAllowedImportUrl", () => {
  it("aceita páginas de música do Cifra Club", () => {
    expect(
      isAllowedImportUrl("https://www.cifraclub.com.br/artista/musica/"),
    ).toBe(true);
    expect(isAllowedImportUrl("https://cifraclub.com.br/artista/musica")).toBe(
      true,
    );
  });

  it.each([
    "http://www.cifraclub.com.br/artista/musica/",
    "https://exemplo.com/artista/musica/",
    "https://www.cifraclub.com.br.evil.com/artista/musica/",
    "https://usuario@www.cifraclub.com.br/artista/musica/",
    "https://www.cifraclub.com.br/artista/",
    "https://www.cifraclub.com.br/",
    "http://127.0.0.1/artista/musica/",
    "javascript:alert(1)",
    "não é url",
  ])("rejeita %s", (url) => {
    expect(isAllowedImportUrl(url)).toBe(false);
  });
});

describe("parseSearchResults", () => {
  it("retorna só páginas de música permitidas, sem duplicatas", () => {
    const results = parseSearchResults(searchHtml);
    expect(results.map((item) => item.url)).toEqual([
      "https://www.cifraclub.com.br/chitaozinho-e-xororo/evidencias/",
      "https://www.cifraclub.com.br/legiao-urbana/pais-e-filhos/",
    ]);
  });

  it("separa título e artista e remove sufixos do site", () => {
    const [first, second] = parseSearchResults(searchHtml);
    expect(first).toMatchObject({
      title: "Evidências",
      artist: "Chitãozinho & Xororó",
    });
    expect(second).toMatchObject({
      title: "Pais e Filhos",
      artist: "Legião Urbana",
    });
  });

  it("devolve lista vazia quando não há resultados", () => {
    expect(parseSearchResults("<html></html>")).toEqual([]);
  });
});

describe("extractChordPage", () => {
  it("extrai título, artista, tom e texto da cifra", () => {
    const page = extractChordPage(songHtml);
    expect(page).toMatchObject({
      title: "Evidências",
      artist: "Chitãozinho & Xororó",
      key: "G",
    });
    expect(page?.text).toContain("Quando eu digo que deixei de te amar");
    expect(page?.text).toContain("É porque eu te amo & quero");
    expect(page?.text).not.toContain("<b>");
  });

  it("gera texto que o parser de cifra entende", () => {
    const draft = parseChordSheet(extractChordPage(songHtml)?.text ?? "");
    const lines = draft.sections.flatMap((section) => section.lines);
    expect(
      lines.some((line) => line.chords?.some((item) => item.chord === "D/F#")),
    ).toBe(true);
  });

  it("devolve null quando a página não traz cifra", () => {
    expect(
      extractChordPage("<html><body><h1>Nada</h1></body></html>"),
    ).toBeNull();
  });
});

describe("etapas da importação", () => {
  it("começa com todas as etapas pendentes", () => {
    const steps = initialSteps();
    expect(steps.map((step) => step.id)).toEqual([
      "search",
      "fetch",
      "extract",
      "draft",
    ] satisfies ImportStepId[]);
    expect(steps.every((step) => step.status === "pending")).toBe(true);
  });

  it("atualiza apenas a etapa informada", () => {
    const steps = updateStep(initialSteps(), "fetch", {
      status: "failed",
      message: "Tempo esgotado",
    });
    expect(steps.find((step) => step.id === "fetch")).toMatchObject({
      status: "failed",
      message: "Tempo esgotado",
    });
    expect(steps.find((step) => step.id === "search")?.status).toBe("pending");
  });
});
