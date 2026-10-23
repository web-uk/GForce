import { test, expect } from "@playwright/test";
import { setup, go } from "./helpers";
test("busca, referência visual e teclado na biblioteca", async ({ page }) => {
  await setup(page);
  await go(page, "exercicios");
  await page.getByLabel("Buscar", { exact: true }).fill("parede");
  await expect(
    page.getByRole("heading", { name: "Flexão na parede" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ver como fazer" }).click();
  await expect(
    page.getByRole("link", { name: /Ver demonstração/ }),
  ).toHaveAttribute("href", /nhs/);
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
});
