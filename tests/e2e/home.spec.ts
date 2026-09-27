import { expect, test } from "@playwright/test";

test.describe("Home", () => {
  test("apresenta a proposta principal e as ações de entrada", async ({
    page
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Sua música, no tempo certo." }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: /Abrir player/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Explorar biblioteca/ }),
    ).toBeVisible();
  });

  test("mantém a experiência acessível em mobile", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Sua música, no tempo certo." }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: /Abrir player/ }),
    ).toBeVisible();
  });
});
