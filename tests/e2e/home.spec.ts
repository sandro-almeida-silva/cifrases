import { expect, test } from "@playwright/test";

const seededSong = {
  id: "e2e-song",
  slug: "primeira-cancao",
  title: "Primeira Canção",
  artist: "Cifrases",
  key: "G",
  media: { audioUrl: "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=" },
  timeline: {
    events: [
      { atMs: 1000, sectionId: "section-intro", lineId: "line-intro" },
      { atMs: 3000, sectionId: "section-verse", lineId: "line-verse-1", beat: 1, measure: 1 },
      { atMs: 5000, sectionId: "section-chorus", lineId: "line-chorus" },
    ],
  },
  sections: [
    {
      id: "section-intro",
      type: "intro",
      label: "Introdução",
      lines: [{ id: "line-intro", text: "A música começa quando o tempo encontra a letra.", chords: [{ chord: "G", position: 0 }, { chord: "C", position: 24 }] }],
    },
    {
      id: "section-verse",
      type: "verse",
      label: "Verso",
      lines: [
        { id: "line-verse-1", text: "Cada acorde abre espaço para a próxima frase.", chords: [{ chord: "G", position: 0 }, { chord: "D", position: 22 }] },
        { id: "line-verse-2", text: "Cada palavra encontra o seu lugar.", chords: [{ chord: "Em", position: 0 }, { chord: "C", position: 19 }] },
      ],
    },
    {
      id: "section-chorus",
      type: "chorus",
      label: "Refrão",
      lines: [{ id: "line-chorus", text: "E quando tudo se alinha, a música acontece.", chords: [{ chord: "C", position: 0 }, { chord: "G", position: 26 }, { chord: "D", position: 39 }] }],
    },
  ],
};

test.describe("Cifrases", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((song) => {
      if (!localStorage.getItem("cifrases:songs:v1")) {
        localStorage.setItem("cifrases:songs:v1", JSON.stringify([song]));
      }
    }, seededSong);
  });

  test("opens the library and player", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Suas músicas" })).toBeVisible();
    await expect(page.getByText("Primeira Canção")).toBeVisible();
    await page.getByRole("button", { name: "Abrir Primeira Canção" }).click();
    await expect(page.getByRole("heading", { name: "Primeira Canção" })).toBeVisible();
    await expect(page.getByText("Detalhes da música")).toBeVisible();
    await page.getByRole("button", { name: "Tocar" }).click();
    await expect(page.getByRole("heading", { name: "Primeira Canção" })).toBeVisible();
    await expect(page.getByText("Aguardando evento")).toBeVisible();
    await expect(page.getByText("A música começa quando o tempo encontra a letra.")).toBeVisible();
    await expect(page.getByRole("button", { name: "1. Introdução" })).toBeVisible();
    await expect(page.getByRole("button", { name: "2. Verso" })).toBeVisible();
    await expect(page.locator(".text-chord").filter({ hasText: "G" }).first()).toBeVisible();
    await page.getByRole("button", { name: "2. Verso" }).click();
    await expect(page.getByText("Cada acorde abre espaço para a próxima frase.")).toBeVisible();
    await page.getByRole("button", { name: "+ ½" }).click();
    await expect(page.locator(".text-chord").filter({ hasText: "G#" }).first()).toBeVisible();
    await page.getByRole("button", { name: "Original" }).click();
    await expect(page.getByText("G", { exact: true }).first()).toBeVisible();

    const persisted = await page.evaluate(() => {
      const raw = localStorage.getItem("cifrases:songs:v1");
      const songs = raw ? JSON.parse(raw) : [];
      return songs[0]?.key;
    });
    expect(persisted).toBe("G");
    await expect(page.getByRole("button", { name: "Biblioteca" }).last()).toBeVisible();
  });

  test("persists player reading preferences", async ({ page }, testInfo) => {
    await page.goto("/");
    if (testInfo.project.name === "mobile-chrome") {
      await page.getByRole("button", { name: "Abrir menu" }).click();
      await page.locator('button[title="Biblioteca"]').click();
    }

    await page.getByRole("button", { name: "Abrir Primeira Canção" }).click();
    await page.getByRole("button", { name: "Tocar" }).click();

    const lyric = page.getByText("A música começa quando o tempo encontra a letra.");
    const initialSize = await lyric.evaluate((element) => getComputedStyle(element).fontSize);

    await page.getByRole("button", { name: "A+" }).click();
    await expect.poll(() => lyric.evaluate((element) => getComputedStyle(element).fontSize)).not.toBe(initialSize);

    await page.getByRole("button", { name: "Espaço +" }).click();
    await page.getByRole("button", { name: "Largura" }).click();
    await page.getByRole("button", { name: "Alto contraste" }).click();
    await expect(page.getByRole("button", { name: "Alto contraste" })).toHaveAttribute("aria-pressed", "true");

    await page.reload();
    await page.getByRole("button", { name: "Abrir Primeira Canção" }).click();
    await page.getByRole("button", { name: "Tocar" }).click();
    await expect(page.getByRole("button", { name: "Alto contraste" })).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("button", { name: "Restaurar padrão" }).click();
    await expect(page.getByRole("button", { name: "Alto contraste" })).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByRole("button", { name: "Tela cheia" })).toBeVisible();
  });

  test("controls audio playback without mutating the song", async ({ page }, testInfo) => {
    await page.goto("/");
    if (testInfo.project.name === "mobile-chrome") {
      await page.getByRole("button", { name: "Abrir menu" }).click();
      await page.locator('button[title="Biblioteca"]').click();
    }

    await page.getByRole("button", { name: "Abrir Primeira Canção" }).click();
    await page.getByRole("button", { name: "Tocar" }).click();

    await expect(page.getByRole("button", { name: "Tocar áudio" })).toBeVisible();
    await expect(page.getByRole("slider", { name: "Progresso do áudio" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Silenciar áudio" })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Velocidade de reprodução" })).toBeVisible();

    await page.getByRole("combobox", { name: "Velocidade de reprodução" }).selectOption("1.5");
    await page.getByRole("button", { name: "Silenciar áudio" }).click();
    await expect(page.getByRole("button", { name: "Ativar som" })).toBeVisible();
    await page.getByRole("button", { name: "Recomeçar" }).click();

    const persisted = await page.evaluate(() => {
      const raw = localStorage.getItem("cifrases:songs:v1");
      const songs = raw ? JSON.parse(raw) : [];
      return songs[0]?.media?.audioUrl;
    });
    expect(persisted).toContain("data:audio/wav");
  });

  test("duplicates and deletes a song from details", async ({ page }, testInfo) => {
    await page.goto("/");
    if (testInfo.project.name === "mobile-chrome") {
      await page.getByRole("button", { name: "Abrir menu" }).click();
      await page.locator('button[title="Biblioteca"]').click();
    }

    await page.getByRole("button", { name: "Abrir Primeira Canção" }).click();
    await page.getByRole("button", { name: "Duplicar" }).click();
    await expect(page.getByRole("heading", { name: "Primeira Canção (cópia)" })).toBeVisible();

    await page.getByRole("button", { name: "Biblioteca" }).last().click();
    await expect(page.getByText("Primeira Canção (cópia)")).toBeVisible();

    await page.getByRole("button", { name: "Abrir Primeira Canção (cópia)" }).click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Excluir" }).click();
    await expect(page.getByRole("heading", { name: "Primeira Canção (cópia)" })).not.toBeVisible();
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
    await page.getByRole("spinbutton", { name: "BPM", exact: true }).fill("120");

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
    await expect(page.getByRole("heading", { name: "Canção Completa" })).toBeVisible();

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

  test("controls synchronized auto-scroll without taking over manual reading", async ({ page }, testInfo) => {
    await page.addInitScript((song) => {
      window.localStorage.setItem("cifrases:songs:v1", JSON.stringify([song]));
    }, seededSong);

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Suas músicas" })).toBeVisible();
    await expect(page.getByText("Primeira Canção")).toBeVisible();

    if (testInfo.project.name === "mobile-chrome") {
      await page.getByRole("button", { name: "Abrir menu" }).click();
      await page.locator('button[title="Biblioteca"]').click();
      await expect(page.getByRole("heading", { name: "Suas músicas" })).toBeVisible();
    }

    const openButton = page.getByRole("button", { name: "Abrir Primeira Canção" });
    await expect(openButton).toBeVisible();
    await openButton.click();

    await expect(page.getByText("Detalhes da música", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Primeira Canção" })).toBeVisible();
    await page.getByRole("button", { name: "Tocar" }).click();

    await expect(page.getByText("Rolagem automática")).toBeVisible();
    await expect(page.getByRole("button", { name: "Pausar" })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Pausar" }).click();
    await expect(page.getByRole("button", { name: "Retomar" })).toHaveAttribute("aria-pressed", "false");
    await page.getByRole("button", { name: "Retomar" }).click();
    await expect(page.getByRole("button", { name: "Pausar" })).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("button", { name: "Auto-scroll on" }).click();
    await expect(page.getByRole("button", { name: "Auto-scroll off" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Desativada" })).toBeDisabled();
  });
