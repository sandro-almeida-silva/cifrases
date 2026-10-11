import { expect, type Page, test } from "@playwright/test";

function song(id: string, title: string) {
  return {
    id,
    slug: id,
    title,
    sections: [{ id: `s-${id}`, type: "verse", label: "Verso", lines: [{ id: `l-${id}`, text: `Letra ${title}`, chords: [{ chord: "G", position: 0 }] }] }],
  };
}

async function openPlaylists(page: Page, projectName: string) {
  if (projectName === "mobile-chrome") {
    await page.getByRole("button", { name: "Abrir menu" }).click();
  }
  await page.locator('nav[aria-label="Navegação principal"]').getByRole("button", { name: "Repertórios" }).click();
  await expect(page.getByRole("heading", { name: "Repertórios" })).toBeVisible();
}

test.describe("Repertórios", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await page.addInitScript((songs) => {
      if (!localStorage.getItem("cifrases:songs:v1")) {
        localStorage.setItem("cifrases:songs:v1", JSON.stringify(songs));
      }
    }, [song("a", "Alfa"), song("b", "Beta")]);
    await page.goto("/");
    await openPlaylists(page, testInfo.project.name);
  });

  test("cria, ordena e persiste um repertório", async ({ page }, testInfo) => {
    await page.getByLabel("Nome do repertório").fill("Domingo");
    await page.getByRole("button", { name: "Criar repertório" }).click();

    const card = page.getByRole("article", { name: "Repertório Domingo" });
    await expect(card.getByText("Este repertório está vazio")).toBeVisible();
    await expect(card.getByRole("button", { name: "Tocar repertório" })).toBeDisabled();

    await card.getByLabel("Adicionar música a Domingo").selectOption({ label: "Alfa" });
    await card.getByLabel("Adicionar música a Domingo").selectOption({ label: "Beta" });
    await expect(card.getByRole("listitem")).toHaveText([/Alfa/, /Beta/]);

    await card.getByRole("button", { name: "Subir Beta" }).click();
    await expect(card.getByRole("listitem")).toHaveText([/Beta/, /Alfa/]);

    await page.reload();
    await openPlaylists(page, testInfo.project.name);
    await expect(page.getByRole("article", { name: "Repertório Domingo" }).getByRole("listitem")).toHaveText([/Beta/, /Alfa/]);
  });

  test("toca o repertório na ordem e navega entre músicas", async ({ page }) => {
    await page.getByLabel("Nome do repertório").fill("Culto");
    await page.getByRole("button", { name: "Criar repertório" }).click();
    const card = page.getByRole("article", { name: "Repertório Culto" });
    await card.getByLabel("Adicionar música a Culto").selectOption({ label: "Beta" });
    await card.getByLabel("Adicionar música a Culto").selectOption({ label: "Alfa" });
    await card.getByRole("button", { name: "Tocar repertório" }).click();

    await expect(page.getByRole("heading", { name: "Beta" })).toBeVisible();
    await expect(page.getByText("Repertório Culto: 1 de 2")).toBeVisible();
    await expect(page.getByRole("button", { name: "Música anterior" })).toBeDisabled();
    await page.getByRole("button", { name: "Próxima música" }).click();
    await expect(page.getByRole("heading", { name: "Alfa" })).toBeVisible();
    await expect(page.getByText("Repertório Culto: 2 de 2")).toBeVisible();
    await expect(page.getByRole("button", { name: "Próxima música" })).toBeDisabled();
  });

  test("uma música pode estar em vários repertórios e remover não apaga a música", async ({ page }) => {
    for (const name of ["Um", "Dois"]) {
      await page.getByLabel("Nome do repertório").fill(name);
      await page.getByRole("button", { name: "Criar repertório" }).click();
      await page.getByRole("article", { name: `Repertório ${name}` }).getByLabel(`Adicionar música a ${name}`).selectOption({ label: "Alfa" });
    }
    await page.getByRole("button", { name: "Remover Alfa do repertório" }).first().click();
    await expect(page.getByRole("article", { name: "Repertório Um" }).getByText("Este repertório está vazio")).toBeVisible();
    await expect(page.getByRole("article", { name: "Repertório Dois" }).getByRole("listitem")).toHaveText([/Alfa/]);
  });
});
