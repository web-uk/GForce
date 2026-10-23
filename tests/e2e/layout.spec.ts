import { test, expect } from "@playwright/test";
import { setup, go, testPassword } from "./helpers";

test("campos mantêm fonte mínima de 16px e páginas cabem na tela após login", async ({
  page,
}, info) => {
  await page.goto("./");
  const password = page.getByLabel("Senha", { exact: true });
  await password.focus();
  expect(
    await password.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
  ).toBeGreaterThanOrEqual(16);
  await password.fill(testPassword);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  const fields = page.locator(
    "input:not([type=checkbox]):not([type=range]), select, textarea",
  );
  for (const field of await fields.all()) {
    if (await field.isVisible())
      expect(
        await field.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
      ).toBeGreaterThanOrEqual(16);
  }
  // Completar o perfil usa a mesma interação de quem acabou de entrar.
  await page.getByRole("button", { name: "Agora não", exact: true }).click();
  await page.getByLabel("Faixa etária").selectOption("18–39");
  await page
    .getByRole("combobox", { name: "Experiência", exact: true })
    .selectOption("Iniciante");
  await page
    .getByLabel("Gestação ou recuperação de parto")
    .selectOption("Não se aplica");
  await page
    .getByLabel("Sintomas pélvicos:")
    .selectOption("Não percebo esses sintomas");
  await page.getByRole("button", { name: "Salvar meu perfil" }).click();
  await expect(
    page.getByRole("heading", { name: /Vamos juntas/ }),
  ).toBeVisible();
  for (const route of [
    "hoje",
    "semana",
    "exercicios",
    "evolucao",
    "alimentacao",
    "configuracoes",
  ]) {
    await go(page, route);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (info.project.name.includes("mobile")) {
      for (const field of await fields.all()) {
        if (await field.isVisible())
          expect(
            await field.evaluate((el) =>
              parseFloat(getComputedStyle(el).fontSize),
            ),
          ).toBeGreaterThanOrEqual(16);
      }
    }
  }
  await go(page, "hoje");
  await page.screenshot({
    path: `test-results/layout-apos-login-${info.project.name}.png`,
    fullPage: true,
  });
});

test("recusa do convite mantém a página Hoje ajustada e sem painel técnico", async ({
  page,
}) => {
  await setup(page);
  await expect(
    page.getByRole("region", { name: "Convite para notificações" }),
  ).toHaveCount(0);
  await expect(page.getByText(/OneSignal|serviço de lembretes/)).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
