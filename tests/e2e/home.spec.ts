import { expect, test } from "@playwright/test";

const seededSong = {
  id: "e2e-song",
  slug: "primeira-cancao",
  title: "Primeira Canção",
  artist: "Cifrases",
  key: "G",
  sections: [{ id: "section-1", type: "verse", label: "Verso", lines: [{ id: "line-1", text: "Primeira linha" }] }],
};

test.describe("Cifrases", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((song) => {
      localStorage.setItem("cifrases:songs:v1", JSON.stringify([song]));
    }, seededSong);
  });

  test("opens the library and player", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Suas músicas" })).toBeVisible();
    await expect(page.getByText("Primeira Canção")).toBeVisible();
    await page.getByRole("button", { name: "Abrir Primeira Canção" }).click();
    await expect(page.getByRole("heading", { name: "Primeira Canção" })).toBeVisible();
  });

  test("desktop sidebar starts collapsed and can expand", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Desktop-specific sidebar behavior.");
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Expandir menu" })).toBeVisible();
    await page.getByRole("button", { name: "Expandir menu" }).click();
    await expect(page.getByRole("button", { name: "Recolher menu" })).toBeVisible();
  });

  test("creates a song with an automatic slug", async ({ page }, testInfo) => {
    await page.goto("/");

    if (testInfo.project.name === "mobile-chrome") {
      await page.getByRole("button", { name: "Abrir menu" }).click();
    }

    await page.getByRole("button", { name: "Nova música" }).click();
    await expect(page.getByRole("heading", { name: "Cadastrar música" })).toBeVisible();
    await expect(page.getByText("Slug", { exact: true })).toHaveCount(0);

    await page
      .getByText("Título", { exact: true })
      .locator("..")
      .getByRole("textbox")
      .fill("Canção Dourada");
    await page
      .getByText("Artista", { exact: true })
      .locator("..")
      .getByRole("textbox")
      .fill("Cifrases");
    await page.getByRole("button", { name: "Salvar" }).click();

    await expect(page.getByRole("heading", { name: "Canção Dourada" })).toBeVisible();

    const savedSlug = await page.evaluate(() => {
      const raw = localStorage.getItem("cifrases:songs:v1");
      const songs = raw ? JSON.parse(raw) : [];
      return songs.find((song: { title?: string }) => song.title === "Canção Dourada")?.slug;
    });
    expect(savedSlug).toBe("cancao-dourada");
  });

  test("shows an actionable empty state", async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem("cifrases:songs:v1"));
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Sua biblioteca está vazia" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cadastrar primeira música" })).toBeVisible();
  });

  test("keeps the primary flow usable on mobile", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Suas músicas" })).toBeVisible();
    await expect(page.getByText("Primeira Canção")).toBeVisible();
  });


  test("custom selects are readable and keyboard accessible", async ({ page }) => {
    await page.goto("/");
    const categorySelect = page.getByRole("button", { name: "Filtrar por categoria" });
    const sortSelect = page.getByRole("button", { name: "Ordenar músicas" });

    await expect(categorySelect).toBeVisible();
    await expect(sortSelect).toBeVisible();

    const triggerStyles = await categorySelect.evaluate((element) => {
      const computed = window.getComputedStyle(element);
      return {
        background: computed.backgroundColor,
        color: computed.color,
      };
    });

    expect(triggerStyles.background).not.toBe("rgb(255, 255, 255)");
    expect(triggerStyles.color).not.toBe("rgb(255, 255, 255)");

    await categorySelect.click();
    const categoryListbox = page.getByRole("listbox", { name: "Filtrar por categoria" });
    await expect(categoryListbox).toBeVisible();

    const options = categoryListbox.getByRole("option");
    await expect(options).toHaveCount(1);

    const optionStyles = await options.first().evaluate((element) => {
      const computed = window.getComputedStyle(element);
      return {
        background: computed.backgroundColor,
        color: computed.color,
      };
    });

    expect(optionStyles.background).not.toBe("rgb(255, 255, 255)");
    expect(optionStyles.color).not.toBe("rgb(255, 255, 255)");

    await categorySelect.press("ArrowDown");
    await expect(categorySelect).toBeFocused();
    await categorySelect.press("Enter");
    await expect(categoryListbox).not.toBeVisible();
  });

  test("editor select has an accessible name and readable styles", async ({ page }, testInfo) => {
    await page.goto("/");

    if (testInfo.project.name === "mobile-chrome") {
      await page.getByRole("button", { name: "Abrir menu" }).click();
    }

    await page.getByRole("button", { name: "Nova música" }).click();
    const sectionSelect = page.getByRole("button", { name: "Tipo da seção 1" });

    await expect(sectionSelect).toBeVisible();
    await expect(sectionSelect).toHaveText("Verso");

    await sectionSelect.click();
    const listbox = page.getByRole("listbox", { name: "Tipo da seção 1" });
    await expect(listbox).toBeVisible();
    await expect(listbox.getByRole("option")).toHaveCount(7);

    const optionStyles = await listbox.getByRole("option").first().evaluate((element) => {
      const computed = window.getComputedStyle(element);
      return {
        background: computed.backgroundColor,
        color: computed.color,
      };
    });

    expect(optionStyles.background).not.toBe("rgb(255, 255, 255)");
    expect(optionStyles.color).not.toBe("rgb(255, 255, 255)");

    await sectionSelect.press("ArrowDown");
    await sectionSelect.press("Enter");
    await expect(sectionSelect).toHaveText("Pré-refrão");
  });

});
