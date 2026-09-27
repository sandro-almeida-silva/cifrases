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

  test("creates a complete song manually", async ({ page }, testInfo) => {
    await page.goto("/");

    if (testInfo.project.name === "mobile-chrome") {
      await page.getByRole("button", { name: "Abrir menu" }).click();
    }

    await page.getByRole("button", { name: "Nova música" }).click();
    await expect(page.getByRole("heading", { name: "Cadastrar música" })).toBeVisible();

    await page.getByText("Título", { exact: true }).locator("..").getByRole("textbox").fill("Canção Completa");
    await page.getByText("Artista", { exact: true }).locator("..").getByRole("textbox").fill("Banda Cifrases");
    await page.getByText("Categoria", { exact: true }).locator("..").getByRole("textbox").fill("Louvor");
    await page.getByText("Tonalidade", { exact: true }).locator("..").getByRole("textbox").fill("G");
    await page.getByText("BPM", { exact: true }).locator("..").getByRole("spinbutton").fill("120");

    await page.getByRole("textbox", { name: "Nome da seção 1" }).fill("Verso principal");
    await page.getByRole("textbox", { name: "Letra da linha 1 da seção 1" }).fill("Minha primeira linha");
    await page.getByRole("textbox", { name: "Acordes da linha 1 da seção 1" }).fill("G@0 C@20");

    await page.getByRole("button", { name: "Seção", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Nome da seção 2" })).toBeVisible();
    await page.getByRole("textbox", { name: "Nome da seção 2" }).fill("Refrão");
    await page.getByRole("textbox", { name: "Letra da linha 1 da seção 2" }).fill("Meu refrão");
    await page.getByRole("textbox", { name: "Acordes da linha 1 da seção 2" }).fill("C@0 G@20");

    await page.getByRole("button", { name: "Mover seção 2 para cima" }).click();
    await expect(page.getByRole("textbox", { name: "Nome da seção 1" })).toHaveValue("Refrão");
    await page.getByRole("button", { name: "Remover seção 2" }).click();

    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByRole("heading", { name: "Canção Completa" })).toBeVisible();

    await page.getByRole("button", { name: "Biblioteca" }).last().click();
    await expect(page.getByText("Canção Completa")).toBeVisible();

    const saved = await page.evaluate(() => {
      const raw = localStorage.getItem("cifrases:songs:v1");
      const songs = raw ? JSON.parse(raw) : [];
      return songs.find((song: { title?: string }) => song.title === "Canção Completa");
    });
    expect(saved.artist).toBe("Banda Cifrases");
    expect(saved.sections[0].label).toBe("Refrão");
    expect(saved.sections[0].lines[0].chords).toEqual([
      { chord: "C", position: 0 },
      { chord: "G", position: 20 },
    ]);
  });

  test("shows validation errors before saving", async ({ page }, testInfo) => {
    await page.goto("/");
    if (testInfo.project.name === "mobile-chrome") {
      await page.getByRole("button", { name: "Abrir menu" }).click();
    }
    await page.getByRole("button", { name: "Nova música" }).click();
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText("Informe o título da música.")).toBeVisible();
    await expect(page.getByText("Informe a letra ou um acorde na linha 1.")).toBeVisible();
  });

  test("edits a song without duplicating it and persists changes", async ({ page }, testInfo) => {
    await page.goto("/");
    if (testInfo.project.name === "mobile-chrome") {
      await page.getByRole("button", { name: "Abrir menu" }).click();
      await page.locator('button[title="Biblioteca"]').click();
    }

    await page.getByRole("button", { name: "Abrir Primeira Canção" }).click();
    await page.getByRole("button", { name: "Editar" }).click();
    await expect(page.getByRole("heading", { name: "Editar música" })).toBeVisible();

    await page.getByText("Título", { exact: true }).locator("..").getByRole("textbox").fill("Primeira Canção Atualizada");
    await expect(page.getByText("Alterações não salvas")).toBeVisible();
    await page.getByRole("button", { name: "Salvar" }).click();

    await expect(page.getByRole("heading", { name: "Primeira Canção Atualizada" })).toBeVisible();
    await page.reload();
    await expect(page.getByText("Primeira Canção Atualizada")).toBeVisible();

    const saved = await page.evaluate(() => {
      const raw = localStorage.getItem("cifrases:songs:v1");
      const songs = raw ? JSON.parse(raw) : [];
      return songs;
    });
    expect(saved).toHaveLength(1);
    expect(saved[0].title).toBe("Primeira Canção Atualizada");
  });

  test("warns before discarding unsaved edits", async ({ page }, testInfo) => {
    await page.goto("/");
    if (testInfo.project.name === "mobile-chrome") {
      await page.getByRole("button", { name: "Abrir menu" }).click();
      await page.locator('button[title="Biblioteca"]').click();
    }

    await page.getByRole("button", { name: "Abrir Primeira Canção" }).click();
    await page.getByRole("button", { name: "Editar" }).click();
    await page.getByText("Título", { exact: true }).locator("..").getByRole("textbox").fill("Alteração descartada");
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Cancelar" }).click();

    await expect(page.getByRole("heading", { name: "Primeira Canção" })).toBeVisible();
    await expect(page.getByText("Alteração descartada")).not.toBeVisible();

    const saved = await page.evaluate(() => {
      const raw = localStorage.getItem("cifrases:songs:v1");
      const songs = raw ? JSON.parse(raw) : [];
      return songs[0];
    });
    expect(saved.title).toBe("Primeira Canção");
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
    await page.getByRole("textbox", { name: "Letra da linha 1 da seção 1" }).fill("Linha de teste");
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
