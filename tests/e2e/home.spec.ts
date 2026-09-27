import { expect, test } from "@playwright/test";

test.describe("Cifrases", () => {
  test("opens the library and player", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Suas músicas" })).toBeVisible();
    await expect(page.getByText("Primeira Canção")).toBeVisible();
    await page.getByRole("button", { name: "Abrir Primeira Canção" }).click();
    await expect(page.getByRole("heading", { name: "Primeira Canção" })).toBeVisible();
  });

  test("creates a song from the editor", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Nova música" }).click();
    await expect(page.getByRole("heading", { name: "Cadastrar música" })).toBeVisible();
    await page.getByText("Título", { exact: true }).locator("..").getByRole("textbox").fill("Canção de Teste");
    await page.getByText("Artista", { exact: true }).locator("..").getByRole("textbox").fill("Cifrases");
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByRole("heading", { name: "Canção de Teste" })).toBeVisible();
  });

  test("keeps the primary flow usable on mobile", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Suas músicas" })).toBeVisible();
    await expect(page.getByText("Primeira Canção")).toBeVisible();
  });
});
