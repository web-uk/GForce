import { test, expect } from "@playwright/test";
import { setup, go, getData, testPassword } from "./helpers";
test("backup válido, inválido e exclusão confirmada", async ({ page }) => {
  await setup(page);
  await go(page, "configuracoes");
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Exportar dados / backup JSON" })
    .click();
  expect((await download).suggestedFilename()).toMatch(/GForce-backup/);
  await page.getByLabel("Restaurar backup").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":99}'),
  });
  await expect(page.getByRole("status")).toContainText("Backup inválido");
  const d = await getData(page);
  await page.getByLabel("Restaurar backup").setInputFiles({
    name: "valid.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(d)),
  });
  await expect(page.getByText("Revise antes de substituir")).toBeVisible();
  await page.getByRole("button", { name: "Cancelar restauração" }).click();
  await page
    .getByRole("button", { name: "Excluir todos os dados e reinicializar" })
    .click();
  await expect(
    page.getByRole("button", { name: "Apagar definitivamente" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await page
    .getByRole("button", { name: "Excluir todos os dados e reinicializar" })
    .click();
  await page.getByLabel("Senha atual").fill(testPassword);
  await page.getByLabel("Digite APAGAR").fill("APAGAR");
  await page.getByRole("button", { name: "Apagar definitivamente" }).click();
  await expect(
    page.getByRole("heading", { name: "Bem-vinda ao GForce!" }),
  ).toBeVisible();
});
