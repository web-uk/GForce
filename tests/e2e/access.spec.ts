import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  setup,
  go,
  getData,
  testPassword,
  queueUpdate,
  expectAutomaticReload,
} from "./helpers";

test("boas-vindas com uma senha já definida, teclado e acesso lembrado", async ({
  page,
}, info) => {
  await page.goto("./");
  await expect(
    page.getByRole("heading", { name: "Bem-vinda ao GForce!" }),
  ).toBeVisible();
  await expect(
    page.getByText("Um passo de cada vez.", { exact: false }),
  ).toBeVisible();
  await expect(page.locator('input[type="password"]')).toHaveCount(1);
  await expect(
    page.getByText(/Crie uma senha|Confirme a senha|Criar senha/),
  ).toHaveCount(0);
  await page.screenshot({
    path: `test-results/acesso-${info.project.name}.png`,
    fullPage: true,
  });
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Senha", { exact: true })).toBeFocused();
  await page.keyboard.type("senha-incorreta");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("alert")).toContainText("Senha incorreta");
  await page.getByLabel("Senha", { exact: true }).fill(testPassword);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByLabel("Faixa etária")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Faixa etária")).toBeVisible();
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
});

test("bloqueio manual exige a senha única e preserva o perfil", async ({
  page,
}) => {
  await setup(page);
  const before = await getData(page);
  await go(page, "configuracoes");
  await page
    .getByRole("button", { name: "Bloquear agora", exact: true })
    .last()
    .click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Bem-vinda de volta." }),
  ).toBeVisible();
  await expect(page.locator('input[type="password"]')).toHaveCount(1);
  await page.getByLabel("Senha", { exact: true }).fill("senha-errada");
  await page.getByRole("button", { name: "Desbloquear" }).click();
  await expect(page.getByRole("alert")).toContainText("Senha incorreta");
  await page.getByLabel("Senha", { exact: true }).fill(testPassword);
  await page.getByRole("button", { name: "Desbloquear" }).click();
  await expect(
    page.getByRole("heading", { name: "Configurações." }),
  ).toBeVisible();
  expect((await getData(page)).profile).toEqual(before.profile);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Configurações." }),
  ).toBeVisible();
});

test("atualização automática antes do login preserva dados e bloqueio", async ({
  page,
}) => {
  await setup(page);
  const before = await getData(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await go(page, "configuracoes");
  await page
    .getByRole("button", { name: "Bloquear agora", exact: true })
    .last()
    .click();
  await page.waitForTimeout(3200); // a atualização chegou depois da abertura
  await queueUpdate(page, "/GForce/sw.js?access-update=3");
  await page.reload();
  await expectAutomaticReload(page);
  await expect(
    page.getByRole("heading", { name: "Bem-vinda de volta." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: /Atualizar agora|Conclua o treino para atualizar/,
    }),
  ).toHaveCount(0);
  await expect(page.locator('input[type="password"]')).toHaveCount(1);
  expect((await getData(page)).profile).toEqual(before.profile);
});
