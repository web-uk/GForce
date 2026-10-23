import { test, expect } from "@playwright/test";
import { setup, go } from "./helpers";
test("organização de refeições persiste após recarregar", async ({ page }) => {
  await setup(page);
  await go(page, "alimentacao");
  await page
    .getByLabel("Edite conforme sua rotina")
    .fill("Arroz, feijão e legumes");
  await page.getByRole("button", { name: "Salvar organização" }).click();
  await expect(
    page.getByText("Refeições e compras salvas neste navegador."),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Edite conforme sua rotina")).toHaveValue(
    "Arroz, feijão e legumes",
  );
});
