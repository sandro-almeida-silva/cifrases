import { expect, type Page, test } from "@playwright/test";

function song(id: string, title: string, artist: string) {
  return {
    id,
    slug: id,
    title,
    artist,
    sections: [{ id: `s-${id}`, type: "verse", label: "Verso", lines: [{ id: `l-${id}`, text: `Letra ${title}`, chords: [] }] }],
  };
}

async function openPlaylists(page: Page, projectName: string) {
  if (projectName === "mobile-chrome") {
    await page.getByRole("button", { name: "Abrir menu" }).click();
  }
  await page.locator('nav[aria-label="Navegação principal"]').getByRole("button", { name: "Repertórios" }).click();
  await expect(page.getByRole("heading", { name: "Repertórios" })).toBeVisible();
}

test.describe("Repertório em lote", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await page.addInitScript((songs) => {
      if (!localStorage.getItem("cifrases:songs:v1")) {
        localStorage.setItem("cifrases:songs:v1", JSON.stringify(songs));
      }
    }, [song("a", "Alfa", "Banda"), song("c", "Gama", "Banda")]);
    await page.goto("/");
    await openPlaylists(page, testInfo.project.name);
  });

  test("vincula existentes, enfileira ausentes e mantém a ordem após importar", async ({ page }) => {
    await page.getByText("Importar lista de músicas").click();
    await page.getByLabel("Nome do novo repertório").fill("Culto");
    await page.getByLabel("Lista de músicas").fill("1. Alfa\n2. Beta - Fulano\n3. gama\n4. Alfa");
    await page.getByRole("button", { name: "Criar repertório da lista" }).click();

    await expect(page.getByRole("status")).toHaveText("3 de 4 músicas já estão na biblioteca.");
    const card = page.getByRole("article", { name: "Repertório Culto" });
    await expect(card.getByRole("listitem")).toHaveText([/Alfa/, /Gama/]);
    await expect(page.getByRole("list", { name: "Fila de importação" }).getByRole("listitem")).toHaveCount(1);

    await page.getByRole("button", { name: "Importar cifra de Beta" }).click();
    await expect(page.getByLabel("Título", { exact: true })).toHaveValue("Beta");
    await page.getByLabel("Texto da cifra").fill("C G\nLetra de Beta");
    await page.getByRole("button", { name: "Salvar na biblioteca" }).click();

    await expect(page.getByRole("heading", { name: "Repertórios" })).toBeVisible();
    await expect(page.getByRole("article", { name: "Repertório Culto" }).getByRole("listitem")).toHaveText([/Alfa/, /Beta/, /Gama/]);
    await expect(page.getByRole("status")).toHaveText("4 de 4 músicas já estão na biblioteca.");
  });
});
