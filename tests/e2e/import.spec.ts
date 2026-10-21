import { expect, test } from "@playwright/test";

const cifra = ["[Refrão]", "C        G", "Cante comigo agora", "Am       F", "Toda a vida"].join("\n");

test.describe("Importação de cifra colada", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("cifrases:songs:v1", "[]");
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Colar cifra" }).click();
  });

  test("gera prévia, exige título e salva na biblioteca", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Importar cifra colada" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Salvar na biblioteca" })).toBeDisabled();

    await page.getByLabel("Texto da cifra").fill(cifra);
    const preview = page.getByLabel("Prévia da cifra");
    await expect(preview.getByText("Cante comigo agora")).toBeVisible();
    await expect(preview.getByText("Am", { exact: true })).toBeVisible();
    await expect(page.getByText("Revise antes de salvar")).toBeVisible();
    await expect(page.getByRole("button", { name: "Salvar na biblioteca" })).toBeDisabled();

    await page.getByLabel("Título", { exact: true }).fill("Cante Comigo");
    await expect(page.getByRole("button", { name: "Salvar na biblioteca" })).toBeEnabled();
    await page.getByRole("button", { name: "Salvar na biblioteca" }).click();

    await expect(page.getByRole("heading", { name: "Cante Comigo" })).toBeVisible();
    await expect(page.getByText("Toda a vida")).toBeVisible();

    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("cifrases:songs:v1") ?? "[]"));
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ title: "Cante Comigo", slug: "cante-comigo" });
  });

  test("descartar não salva nada", async ({ page }) => {
    await page.getByLabel("Texto da cifra").fill(cifra);
    await page.getByRole("button", { name: "Descartar" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Descartar" }).click();

    await expect(page.getByRole("heading", { name: "Suas músicas" })).toBeVisible();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("cifrases:songs:v1") ?? "[]"));
    expect(saved).toHaveLength(0);
  });
});
