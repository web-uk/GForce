import { test, expect } from "@playwright/test";
import { setup, go, getData } from "./helpers";
test("offline e dados preservados após atualização", async ({
  page,
  context,
}) => {
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
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await context.setOffline(true);
  await go(page, "exercicios");
  await expect(
    page.getByRole("heading", { name: "Exercícios." }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText("offline");
  await context.setOffline(false);
  await page.evaluate(async () => {
    const r = await navigator.serviceWorker.ready;
    await r.update();
  });
  await page.reload();
  expect((await getData(page)).meals).toBe("Arroz, feijão e legumes");
});
test("nova versão do service worker aguarda fim da sessão e preserva registros", async ({
  page,
}) => {
  await setup(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page
    .getByRole("button", { name: "Iniciar treino", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirmar e iniciar" }).click();
  await expect(
    page.getByRole("heading", { name: "Prepare seu espaço" }),
  ).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.register("/GForce/sw.js?test-update=2");
  });
  await expect(
    page.getByRole("button", { name: "Conclua o treino para atualizar" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Encerrar e registrar parcial" })
    .click();
  await page.getByRole("button", { name: "Salvar registro parcial" }).click();
  await expect(
    page.getByRole("button", { name: "Atualizar agora" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Atualizar agora" }).click();
  await expect(page.getByRole("heading", { name: "Evolução." })).toBeVisible();
  expect(((await getData(page)).sessions as unknown[]).length).toBe(1);
});
