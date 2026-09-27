import { expect, test } from "@playwright/test";

test.describe("Cifrases", () => {
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

  test("keeps the primary flow usable on mobile", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Suas músicas" })).toBeVisible();
    await expect(page.getByText("Primeira Canção")).toBeVisible();
  });
});

  test("keeps native selects readable and keyboard accessible", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("combobox", { name: "Filtrar por categoria" })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Ordenar músicas" })).toBeVisible();

    const selectStyle = await page.getByRole("combobox", { name: "Filtrar por categoria" }).evaluate((element) => {
      const select = element as HTMLSelectElement;
      const option = select.options[0];
      const selectComputed = window.getComputedStyle(select);
      const optionComputed = window.getComputedStyle(option);

      return {
        selectColorScheme: selectComputed.colorScheme,
        selectBackground: selectComputed.backgroundColor,
        selectColor: selectComputed.color,
        optionBackground: optionComputed.backgroundColor,
        optionColor: optionComputed.color,
      };
    });

    expect(selectStyle.selectColorScheme).toContain("dark");
    expect(selectStyle.selectBackground).not.toBe("rgb(255, 255, 255)");
    expect(selectStyle.selectColor).not.toBe("rgb(255, 255, 255)");
    expect(selectStyle.optionBackground).not.toBe("rgb(255, 255, 255)");

    await page.getByRole("combobox", { name: "Filtrar por categoria" }).focus();
    await expect(page.getByRole("combobox", { name: "Filtrar por categoria" })).toBeFocused();
  });

  test("editor select has an accessible name and readable styles", async ({ page }, testInfo) => {
    await page.goto("/");

    if (testInfo.project.name === "mobile-chrome") {
      await page.getByRole("button", { name: "Abrir menu" }).click();
    }

    await page.getByRole("button", { name: "Nova música" }).click();
    const sectionSelect = page.getByRole("combobox", { name: "Tipo da seção 1" });

    await expect(sectionSelect).toBeVisible();
    await expect(sectionSelect).toHaveValue("verse");

    const styles = await sectionSelect.evaluate((element) => {
      const computed = window.getComputedStyle(element);
      return {
        colorScheme: computed.colorScheme,
        background: computed.backgroundColor,
        color: computed.color,
      };
    });

    expect(styles.colorScheme).toContain("dark");
    expect(styles.background).not.toBe("rgb(255, 255, 255)");
    expect(styles.color).not.toBe("rgb(255, 255, 255)");
  });
});
