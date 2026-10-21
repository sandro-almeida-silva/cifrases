import { expect, type Page, test } from "@playwright/test";

function song(id: string, title: string) {
  return {
    id,
    slug: id,
    title,
    sections: [
      {
        id: `s-${id}`,
        type: "verse",
        label: "Verso",
        lines: [
          {
            id: `l-${id}`,
            text: `Letra ${title}`,
            chords: [{ chord: "G", position: 0 }],
          },
        ],
      },
    ],
  };
}

async function openPlaylists(page: Page, projectName: string) {
  if (projectName === "mobile-chrome") {
    await page.getByRole("button", { name: "Abrir menu" }).click();
  }
  await page
    .locator('nav[aria-label="Navegação principal"]')
    .getByRole("button", { name: "Repertórios" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Repertórios" }),
  ).toBeVisible();
}

async function createPlaylist(page: Page, name: string, titles: string[]) {
  await page.getByLabel("Nome do repertório").fill(name);
  await page.getByRole("button", { name: "Criar repertório" }).click();
  const card = page.getByRole("article", { name: `Repertório ${name}` });
  for (const title of titles) {
    await card
      .getByLabel(`Adicionar música a ${name}`)
      .selectOption({ label: title });
  }
  return card;
}

async function addBlock(
  card: ReturnType<Page["getByRole"]>,
  playlist: string,
  name: string,
) {
  await card.getByLabel(`Nome do novo bloco em ${playlist}`).fill(name);
  await card.getByRole("button", { name: "Adicionar bloco" }).click();
  await expect(
    card.getByRole("region", { name: `Bloco ${name}` }),
  ).toBeVisible();
}

test.describe("Blocos em repertórios", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await page.addInitScript(
      (songs) => {
        if (!localStorage.getItem("cifrases:songs:v1")) {
          localStorage.setItem("cifrases:songs:v1", JSON.stringify(songs));
        }
      },
      [song("a", "Alfa"), song("b", "Beta"), song("c", "Gama")],
    );
    await page.goto("/");
    await openPlaylists(page, testInfo.project.name);
  });

  test("agrupa por bloco e o player segue a ordem dos blocos", async ({
    page,
  }) => {
    const card = await createPlaylist(page, "Culto", ["Alfa", "Beta", "Gama"]);
    await expect(card.getByRole("region", { name: /^Bloco/ })).toHaveCount(0);

    await addBlock(card, "Culto", "Louvor");
    await addBlock(card, "Culto", "Ceia");
    await expect(
      card
        .getByRole("region", { name: "Bloco Sem bloco" })
        .getByRole("listitem"),
    ).toHaveText([/Alfa/, /Beta/, /Gama/]);

    await card.getByLabel("Bloco de Alfa").selectOption({ label: "Ceia" });
    await card.getByLabel("Bloco de Beta").selectOption({ label: "Louvor" });

    await expect(
      card
        .getByRole("region", { name: "Bloco Sem bloco" })
        .getByRole("listitem"),
    ).toHaveText([/Gama/]);
    await expect(
      card.getByRole("region", { name: "Bloco Louvor" }).getByRole("listitem"),
    ).toHaveText([/Beta/]);
    await expect(
      card.getByRole("region", { name: "Bloco Ceia" }).getByRole("listitem"),
    ).toHaveText([/Alfa/]);

    await card.getByRole("button", { name: "Tocar repertório" }).click();
    await expect(page.getByRole("heading", { name: "Gama" })).toBeVisible();
    await expect(page.getByText("Repertório Culto: 1 de 3")).toBeVisible();
    await page.getByRole("button", { name: "Próxima música" }).click();
    await expect(page.getByRole("heading", { name: "Beta" })).toBeVisible();
    await page.getByRole("button", { name: "Próxima música" }).click();
    await expect(page.getByRole("heading", { name: "Alfa" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Próxima música" }),
    ).toBeDisabled();
  });

  test("reordenar blocos reordena as músicas", async ({ page }) => {
    const card = await createPlaylist(page, "Evento", ["Alfa", "Beta"]);
    await addBlock(card, "Evento", "Abertura");
    await addBlock(card, "Evento", "Final");
    await card.getByLabel("Bloco de Alfa").selectOption({ label: "Abertura" });
    await card.getByLabel("Bloco de Beta").selectOption({ label: "Final" });
    await expect(card.getByRole("listitem")).toHaveText([/Alfa/, /Beta/]);

    await expect(
      card.getByRole("button", { name: "Subir bloco Abertura" }),
    ).toBeDisabled();
    await card.getByRole("button", { name: "Subir bloco Final" }).click();
    await expect(card.getByRole("listitem")).toHaveText([/Beta/, /Alfa/]);
    await expect(
      card.getByRole("button", { name: "Subir bloco Final" }),
    ).toBeDisabled();
  });

  test("renomeia e remove um bloco sem apagar a música", async ({ page }) => {
    const card = await createPlaylist(page, "Ensaio", ["Alfa"]);
    await addBlock(card, "Ensaio", "Aquecimento");
    await card
      .getByLabel("Bloco de Alfa")
      .selectOption({ label: "Aquecimento" });

    page.once("dialog", (dialog) => dialog.accept("Abertura"));
    await card
      .getByRole("button", { name: "Renomear bloco Aquecimento" })
      .click();
    await expect(
      card
        .getByRole("region", { name: "Bloco Abertura" })
        .getByRole("listitem"),
    ).toHaveText([/Alfa/]);
    await expect(
      card.getByRole("region", { name: "Bloco Aquecimento" }),
    ).toHaveCount(0);

    page.once("dialog", (dialog) => dialog.accept());
    await card.getByRole("button", { name: "Excluir bloco Abertura" }).click();
    await expect(card.getByRole("region", { name: /^Bloco/ })).toHaveCount(0);
    await expect(card.getByRole("listitem")).toHaveText([/Alfa/]);
  });

  test("rejeita nome de bloco vazio", async ({ page }) => {
    const card = await createPlaylist(page, "Vazio", ["Alfa"]);
    await expect(
      card.getByRole("button", { name: "Adicionar bloco" }),
    ).toBeDisabled();
    await card.getByLabel("Nome do novo bloco em Vazio").fill("   ");
    await expect(
      card.getByRole("button", { name: "Adicionar bloco" }),
    ).toBeDisabled();
  });

  test("persiste blocos e vínculos após recarregar", async ({
    page,
  }, testInfo) => {
    const card = await createPlaylist(page, "Domingo", ["Alfa", "Beta"]);
    await addBlock(card, "Domingo", "Louvor");
    await card.getByLabel("Bloco de Beta").selectOption({ label: "Louvor" });

    await page.reload();
    await openPlaylists(page, testInfo.project.name);
    const again = page.getByRole("article", { name: "Repertório Domingo" });
    await expect(
      again.getByRole("region", { name: "Bloco Louvor" }).getByRole("listitem"),
    ).toHaveText([/Beta/]);
    await expect(
      again
        .getByRole("region", { name: "Bloco Sem bloco" })
        .getByRole("listitem"),
    ).toHaveText([/Alfa/]);
  });
});
