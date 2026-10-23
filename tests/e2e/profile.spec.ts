import { test, expect } from "@playwright/test";
import { getData, testPassword } from "./helpers";
test("indicadores de avaliação bloqueiam geração automática", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByLabel("Senha", { exact: true }).fill(testPassword);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.getByLabel("Faixa etária").selectOption("40–59");
  await page
    .getByRole("combobox", { name: "Experiência", exact: true })
    .selectOption("Retomando");
  await page
    .getByLabel("Gestação ou recuperação de parto")
    .selectOption("Recuperação do parto");
  await page
    .getByLabel("Sintomas pélvicos:")
    .selectOption("Não percebo esses sintomas");
  await page.getByRole("button", { name: "Salvar meu perfil" }).click();
  await expect(page.getByText("Seu perfil indica necessidade")).toBeVisible();
  expect((await getData(page)).plan).toEqual([]);
  await expect(
    page.getByRole("button", { name: "Iniciar treino", exact: true }),
  ).toHaveCount(0);
});
