import { expect, type Page, test } from "@playwright/test";

function song(id: string, title: string) {
  return {
    id,
    slug: id,
    title,
    artist: "Artista",
    key: "G",
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

async function openFirstSong(page: Page, title: string) {
  await page.getByRole("button", { name: `Abrir ${title}` }).click();
  await page.getByRole("button", { name: "Tocar" }).click();
  await expect(
    page.getByRole("heading", { name: title, level: 1 }),
  ).toBeVisible();
}

test.describe("Biblioteca, música e player acessíveis", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      (songs) => {
        if (!localStorage.getItem("cifrases:songs:v1")) {
          localStorage.setItem("cifrases:songs:v1", JSON.stringify(songs));
          localStorage.setItem(
            "cifrases:library:v1",
            JSON.stringify({
              favorites: ["a"],
              recent: [],
              playlists: [],
              theme: "gold",
            }),
          );
        }
      },
      [song("a", "Alfa"), song("b", "Beta")],
    );
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Suas músicas" }),
    ).toBeVisible();
  });

  test("ações da biblioteca identificam a música e informam o estado", async ({
    page,
  }) => {
    for (const title of ["Alfa", "Beta"]) {
      for (const action of ["Favoritar", "Editar", "Excluir", "Tocar"]) {
        await expect(
          page.getByRole("button", { name: `${action} ${title}` }),
        ).toHaveCount(1);
      }
    }
    await expect(
      page.getByRole("button", { name: "Favoritar Alfa" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("button", { name: "Favoritar Beta" }),
    ).toHaveAttribute("aria-pressed", "false");
    await page.getByRole("button", { name: "Favoritar Beta" }).click();
    await expect(
      page.getByRole("button", { name: "Favoritar Beta" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("excluir pede confirmação: Esc cancela e confirmar exclui", async ({
    page,
  }) => {
    const trigger = page.getByRole("button", { name: "Excluir Beta" });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: /Excluir "Beta"\?/ });
    await expect(
      dialog.getByRole("button", { name: "Cancelar" }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(
      page.getByRole("button", { name: "Abrir Beta" }),
    ).toBeVisible();

    await trigger.click();
    await dialog.getByRole("button", { name: "Excluir música" }).click();
    await expect(page.getByRole("button", { name: "Abrir Beta" })).toHaveCount(
      0,
    );
    await expect(
      page.getByRole("button", { name: "Abrir Alfa" }),
    ).toBeVisible();
  });

  test("o player agrupa os ajustes e mostra o tom atual", async ({ page }) => {
    await openFirstSong(page, "Alfa");
    for (const group of ["Tom", "Texto", "Exibição"]) {
      await expect(page.getByRole("group", { name: group })).toBeVisible();
    }
    const tom = page.getByRole("group", { name: "Tom" });
    await expect(tom.getByRole("status")).toHaveText("G · original");
    await tom.getByRole("button", { name: /subir meio-tom/ }).click();
    await expect(tom.getByRole("status")).toHaveText("G# · +1 meio-tom");
    await tom.getByRole("button", { name: /subir meio-tom/ }).click();
    await expect(tom.getByRole("status")).toHaveText("A · +2 meios-tons");
    await tom.getByRole("button", { name: "Original" }).click();
    await expect(tom.getByRole("status")).toHaveText("G · original");
  });

  test("ocultar os ajustes libera espaço e informa o estado", async ({
    page,
  }) => {
    await openFirstSong(page, "Alfa");
    const toggle = page.getByRole("button", { name: "Ocultar ajustes" });
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(
      page.getByRole("button", { name: "Alto contraste" }),
    ).toBeVisible();

    await toggle.click();
    await expect(
      page.getByRole("button", { name: "Mostrar ajustes" }),
    ).toHaveAttribute("aria-expanded", "false");
    await expect(
      page.getByRole("button", { name: "Alto contraste" }),
    ).toBeHidden();
    await expect(page.getByText("Letra Alfa")).toBeVisible();
  });

  test("controles têm área de toque de 44px no celular", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "mobile-chrome",
      "Só vale para o viewport de celular.",
    );
    const tooSmall = async (selector: string) =>
      page.locator(selector).evaluateAll((nodes) =>
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

    expect(await tooSmall("article button[aria-label]")).toEqual([]);
    await page.getByRole("button", { name: "Abrir Alfa" }).click();
    await page.getByRole("button", { name: "Tocar" }).click();
    expect(
      await tooSmall('section[aria-label="Ajustes de leitura"] button'),
    ).toEqual([]);
    expect(
      await tooSmall('nav[aria-label="Navegação entre seções"] button'),
    ).toEqual([]);
  });
});
