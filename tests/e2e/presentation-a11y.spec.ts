import { expect, type Page, test } from "@playwright/test";

function lines(prefix: string, count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}${index + 1}`,
    text: `${prefix.toUpperCase()} linha ${index + 1}`,
    chords: [],
  }));
}

const song = {
  id: "a",
  slug: "a",
  title: "Alfa",
  artist: "Artista",
  sections: [
    { id: "s1", type: "verse", label: "Verso", lines: lines("v", 6) },
    { id: "s2", type: "chorus", label: "Refrão", lines: lines("r", 2) },
  ],
};

async function openPresentation(page: Page) {
  await page.getByRole("button", { name: "Abrir Alfa" }).click();
  await page.getByRole("button", { name: "Apresentar" }).click();
  await expect(page.getByRole("heading", { name: "Modo 16:9" })).toBeVisible();
}

test.describe("Apresentação acessível", () => {
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

  test("divide seções longas em partes equilibradas sem perder linhas", async ({
    page,
  }) => {
    await openPresentation(page);
    const slide = page.getByRole("group", {
      name: "Slide 1 de 3: Verso (parte 1 de 2)",
    });
    await expect(slide.getByText(/^V linha/)).toHaveText([
      "V linha 1",
      "V linha 2",
      "V linha 3",
    ]);

    await page.getByRole("button", { name: "Próximo slide" }).click();
    await expect(
      page
        .getByRole("group", { name: "Slide 2 de 3: Verso (parte 2 de 2)" })
        .getByText(/^V linha/),
    ).toHaveText(["V linha 4", "V linha 5", "V linha 6"]);

    await page.getByRole("button", { name: "Próximo slide" }).click();
    await expect(
      page
        .getByRole("group", { name: "Slide 3 de 3: Refrão" })
        .getByText(/^R linha/),
    ).toHaveText(["R linha 1", "R linha 2"]);
  });

  test("botão do limite fica indisponível sem tirar o foco", async ({
    page,
  }) => {
    await openPresentation(page);
    const previous = page.getByRole("button", { name: "Slide anterior" });
    const next = page.getByRole("button", { name: "Próximo slide" });
    await expect(previous).toHaveAttribute("aria-disabled", "true");

    await next.click();
    await next.click();
    await expect(next).toHaveAttribute("aria-disabled", "true");
    await expect(next).toBeFocused();
    // Um clique no limite não faz nada; só é disparado com force por causa do aria-disabled.
    await next.click({ force: true });
    await expect(next).toBeFocused();
    await expect(page.getByTestId("slide-announcer")).toHaveText(
      "Slide 3 de 3: Refrão",
    );
    await expect(previous).not.toHaveAttribute("aria-disabled", "true");
  });

  test("navega por teclado e anuncia o slide", async ({ page }) => {
    await openPresentation(page);
    const announcer = page.getByTestId("slide-announcer");
    await expect(announcer).toHaveText("Slide 1 de 3: Verso (parte 1 de 2)");

    await page.keyboard.press("ArrowRight");
    await expect(announcer).toHaveText("Slide 2 de 3: Verso (parte 2 de 2)");
    await page.keyboard.press("End");
    await expect(announcer).toHaveText("Slide 3 de 3: Refrão");
    await page.keyboard.press("ArrowLeft");
    await expect(announcer).toHaveText("Slide 2 de 3: Verso (parte 2 de 2)");
    await page.keyboard.press("Home");
    await expect(announcer).toHaveText("Slide 1 de 3: Verso (parte 1 de 2)");
  });

  test("a lista de slides leva direto ao slide escolhido", async ({ page }) => {
    await openPresentation(page);
    const list = page.getByRole("navigation", { name: "Slides" });
    await expect(
      list.getByRole("button", { name: "1. Verso (1/2)" }),
    ).toHaveAttribute("aria-current", "step");
    await list.getByRole("button", { name: "3. Refrão" }).click();
    await expect(
      list.getByRole("button", { name: "3. Refrão" }),
    ).toHaveAttribute("aria-current", "step");
    await expect(
      page.getByRole("group", { name: "Slide 3 de 3: Refrão" }),
    ).toBeVisible();
  });

  test("sem música aberta mostra orientação e atalho para a biblioteca", async ({
    page,
  }, testInfo) => {
    await page.evaluate(() => localStorage.setItem("cifrases:songs:v1", "[]"));
    await page.reload();
    if (testInfo.project.name === "mobile-chrome") {
      await page.getByRole("button", { name: "Abrir menu" }).click();
    }
    await page
      .locator('nav[aria-label="Navegação principal"]')
      .getByRole("button", { name: "Apresentação" })
      .click();
    await expect(page.getByText("Abra uma música primeiro.")).toBeVisible();
    await page.getByRole("button", { name: "Ir para a biblioteca" }).click();
    await expect(
      page.getByRole("heading", { name: "Suas músicas" }),
    ).toBeVisible();
  });

  test("controles têm 44px no celular e a página não rola na horizontal", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "mobile-chrome",
      "Só vale para o viewport de celular.",
    );
    await openPresentation(page);
    const tooSmall = await page.locator("main button").evaluateAll((nodes) =>
      nodes
        .map((node) => {
          const box = node.getBoundingClientRect();
          return {
            label:
              node.getAttribute("aria-label") ?? node.textContent?.trim() ?? "",
            w: box.width,
            h: box.height,
          };
        })
        .filter((item) => item.w > 0 && (item.w < 43.5 || item.h < 43.5)),
    );
    expect(tooSmall).toEqual([]);
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });
});
