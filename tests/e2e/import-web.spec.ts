import { expect, test } from "@playwright/test";

const result = {
  title: "Evidências",
  artist: "Chitãozinho & Xororó",
  url: "https://www.cifraclub.com.br/chitaozinho-e-xororo/evidencias/",
};
const page = {
  title: "Evidências",
  artist: "Chitãozinho & Xororó",
  key: "G",
  text: [
    "[Refrão]",
    "G        D",
    "Quando eu digo que deixei de te amar",
    "Em       C",
    "É porque eu te amo",
  ].join("\n"),
};

test.describe("Importação de cifra pesquisada na internet", () => {
  // O service worker do app interceptaria o fetch antes do page.route.
  test.use({ serviceWorkers: "block" });

  test.beforeEach(async ({ page: p }) => {
    await p.addInitScript(() => {
      localStorage.setItem("cifrases:songs:v1", "[]");
    });
    await p.goto("/");
    await p.getByRole("button", { name: "Colar cifra" }).click();
  });

  test("busca, escolhe, mostra o progresso e abre a revisão sem salvar", async ({
    page: p,
  }) => {
    await p.route(/\/api\/import\/search/, (route) =>
      route.fulfill({ json: { results: [result] } }),
    );
    await p.route(/\/api\/import\/fetch/, (route) =>
      route.fulfill({ json: { ...page, sourceUrl: result.url } }),
    );

    const steps = p.getByRole("list", { name: "Etapas da importação" });
    await expect(steps).toBeHidden();
    await expect(
      p.getByRole("button", { name: "Buscar", exact: true }),
    ).toBeDisabled();

    await p.getByRole("searchbox", { name: "Buscar cifra" }).fill("evidências");
    await p.getByRole("button", { name: "Buscar", exact: true }).click();

    await expect(p.getByText("1 resultado(s) encontrado(s)")).toBeVisible();
    await expect(steps.getByRole("listitem").first()).toHaveAttribute(
      "data-status",
      "done",
    );

    await p
      .getByRole("button", {
        name: "Importar Evidências — Chitãozinho & Xororó",
      })
      .click();

    await expect(p.getByText(/2 seção|1 seção/)).toBeVisible();
    for (const item of await steps.getByRole("listitem").all()) {
      await expect(item).toHaveAttribute("data-status", "done");
    }
    await expect(
      p.getByRole("heading", { name: "Revise e salve" }),
    ).toBeFocused();
    await expect(p.getByLabel("Título", { exact: true })).toHaveValue(
      "Evidências",
    );
    await expect(p.getByLabel("Artista")).toHaveValue("Chitãozinho & Xororó");
    await expect(p.getByLabel("Tom")).toHaveValue("G");
    await expect(
      p
        .getByLabel("Prévia da cifra")
        .getByText("Quando eu digo que deixei de te amar"),
    ).toBeVisible();

    const saved = await p.evaluate(() =>
      JSON.parse(localStorage.getItem("cifrases:songs:v1") ?? "[]"),
    );
    expect(saved).toHaveLength(0);

    await p.getByRole("button", { name: "Salvar na biblioteca" }).click();
    await expect(p.getByRole("heading", { name: "Evidências" })).toBeVisible();
  });

  test("informa quando a busca não encontra resultados", async ({
    page: p,
  }) => {
    await p.route(/\/api\/import\/search/, (route) =>
      route.fulfill({ json: { results: [] } }),
    );
    await p.getByRole("searchbox", { name: "Buscar cifra" }).fill("zzzzzz");
    await p.getByRole("button", { name: "Buscar", exact: true }).click();
    await expect(p.getByText("Nenhum resultado encontrado")).toBeVisible();
  });

  test("mostra a falha na etapa de download e permite tentar novamente", async ({
    page: p,
  }) => {
    let calls = 0;
    await p.route(/\/api\/import\/search/, (route) =>
      route.fulfill({ json: { results: [result] } }),
    );
    await p.route(/\/api\/import\/fetch/, (route) => {
      calls += 1;
      return calls === 1
        ? route.fulfill({
            status: 504,
            json: {
              step: "fetch",
              error: "A página demorou demais para responder.",
            },
          })
        : route.fulfill({ json: { ...page, sourceUrl: result.url } });
    });

    await p.getByRole("searchbox", { name: "Buscar cifra" }).fill("evidências");
    await p.getByRole("button", { name: "Buscar", exact: true }).click();
    await p
      .getByRole("button", {
        name: "Importar Evidências — Chitãozinho & Xororó",
      })
      .click();

    await expect(
      p.getByText("A página demorou demais para responder."),
    ).toBeVisible();
    const steps = p.getByRole("list", { name: "Etapas da importação" });
    await expect(steps.getByRole("listitem").nth(1)).toHaveAttribute(
      "data-status",
      "failed",
    );
    await expect(p.getByLabel("Texto da cifra")).toHaveValue("");

    await p.getByRole("button", { name: "Tentar novamente" }).click();
    await expect(p.getByLabel("Título", { exact: true })).toHaveValue(
      "Evidências",
    );
    await expect(steps.getByRole("listitem").nth(1)).toHaveAttribute(
      "data-status",
      "done",
    );
  });
});
