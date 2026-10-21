import { expect, type Page, test } from "@playwright/test";

const song = {
  id: "a",
  slug: "a",
  title: "Alfa",
  artist: "Artista",
  key: "G",
  sections: [
    {
      id: "s1",
      type: "verse",
      label: "Verso",
      lines: [
        {
          id: "l1",
          text: "Primeira linha",
          chords: [{ chord: "G", position: 0 }],
        },
        { id: "l2", text: "Segunda linha", chords: [] },
      ],
    },
    {
      id: "s2",
      type: "chorus",
      label: "Refrão",
      lines: [{ id: "l3", text: "Refrão linha", chords: [] }],
    },
  ],
};

async function openEditor(page: Page) {
  await page.getByRole("button", { name: "Editar Alfa" }).click();
  await expect(
    page.getByRole("heading", { name: "Editar música" }),
  ).toBeVisible();
}

test.describe("Editor de música acessível", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((initial) => {
      if (!localStorage.getItem("cifrases:songs:v1")) {
        localStorage.setItem("cifrases:songs:v1", JSON.stringify([initial]));
      }
    }, song);
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Suas músicas" }),
    ).toBeVisible();
  });

  test("seções e linhas são grupos nomeados com ações identificadas", async ({
    page,
  }) => {
    await openEditor(page);
    await expect(
      page.getByRole("region", { name: "Seção 1: Verso" }),
    ).toBeVisible();
    const line = page.getByRole("group", { name: "Linha 2 da seção 1" });
    await expect(
      line.getByRole("textbox", { name: "Letra da linha 2 da seção 1" }),
    ).toHaveValue("Segunda linha");
    await expect(
      line.getByRole("button", { name: "Mover linha 2 para cima" }),
    ).toBeEnabled();
    await expect(
      line.getByRole("button", { name: "Remover linha 2 da seção 1" }),
    ).toBeVisible();
  });

  test("salvar com erro anuncia e foca o primeiro campo inválido", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Nova", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Cadastrar música" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Salvar" }).click();

    await expect(
      page.getByRole("alert").filter({ hasText: "Corrija" }),
    ).toBeVisible();
    const title = page.getByRole("textbox", { name: "Título" });
    await expect(title).toHaveAttribute("aria-invalid", "true");
    await expect(title).toBeFocused();
  });

  test("adicionar e mover mantêm o foco e são anunciados", async ({ page }) => {
    await openEditor(page);
    const announcer = page.getByTestId("editor-announcer");

    await page.getByRole("button", { name: "Seção", exact: true }).click();
    await expect(announcer).toHaveText("Seção adicionada.");
    await expect(
      page.getByRole("textbox", { name: "Nome da seção 3" }),
    ).toBeFocused();

    await page
      .getByRole("button", { name: "Linha", exact: true })
      .first()
      .click();
    await expect(announcer).toHaveText("Linha adicionada à seção 1.");
    await expect(
      page.getByRole("textbox", { name: "Letra da linha 3 da seção 1" }),
    ).toBeFocused();

    await page.getByRole("button", { name: "Mover seção 2 para cima" }).click();
    await expect(announcer).toHaveText("Seção 2 movida para cima.");
    // A seção movida passa a ser a 1ª; o "subir" fica desabilitado e o foco vai ao "descer".
    await expect(
      page.getByRole("button", { name: "Mover seção 1 para baixo" }),
    ).toBeFocused();
  });

  test("remover uma linha devolve o foco ao botão de adicionar linha", async ({
    page,
  }) => {
    await openEditor(page);
    await page
      .getByRole("button", { name: "Remover linha 2 da seção 1" })
      .click();
    await expect(page.getByTestId("editor-announcer")).toHaveText(
      "Linha 2 removida.",
    );
    await expect(
      page
        .getByRole("region", { name: "Seção 1: Verso" })
        .getByRole("button", { name: "Linha", exact: true }),
    ).toBeFocused();
  });

  test("controles têm área de toque de 44px no celular", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "mobile-chrome",
      "Só vale para o viewport de celular.",
    );
    await openEditor(page);
    const tooSmall = await page
      .locator("main button, main select")
      .evaluateAll((nodes) =>
        nodes
          .map((node) => {
            const box = node.getBoundingClientRect();
            return {
              label:
                node.getAttribute("aria-label") ??
                node.textContent?.trim() ??
                "",
              w: box.width,
              h: box.height,
            };
          })
          .filter((item) => item.w > 0 && (item.w < 43.5 || item.h < 43.5)),
      );
    expect(tooSmall).toEqual([]);
  });
});
