import { test, expect } from "@playwright/test";
import { setup, go, getData } from "./helpers";
test("sessão completa, sem duplicação e intervalo entre sessões", async ({
  page,
}) => {
  await setup(page);
  await page
    .getByRole("button", { name: "Iniciar treino", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirmar e iniciar" }).click();
  for (let i = 0; i < 14; i++) {
    const b = page.getByRole("button", { name: "Próxima etapa" });
    if (await b.isDisabled()) break;
    await b.click();
  }
  await page
    .getByRole("button", { name: "Concluir treino", exact: true })
    .click();
  await page.getByRole("button", { name: "Salvar conclusão" }).click();
  await expect(
    page.getByRole("heading", { name: "Sessão A · concluída" }),
  ).toBeVisible();
  await page.reload();
  expect(((await getData(page)).sessions as unknown[]).length).toBe(1);
  await go(page, "hoje");
  await page
    .getByRole("button", { name: "Iniciar treino", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirmar e iniciar" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Reserve ao menos um dia",
  );
});
test("timer usa timestamps e não avança etapas ao suspender", async ({
  page,
}) => {
  await setup(page);
  await page
    .getByRole("button", { name: "Iniciar treino", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirmar e iniciar" }).click();
  await expect(
    page.getByRole("heading", { name: "Prepare seu espaço" }),
  ).toBeVisible();
  await page.clock.install();
  await page.getByRole("button", { name: "Retomar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pausar", exact: true }),
  ).toBeVisible();
  await page.clock.fastForward(120_000);
  await expect(page.locator(".timer")).toHaveText("00:00");
  await expect(
    page.getByRole("heading", { name: "Prepare seu espaço" }),
  ).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(
    page.getByRole("button", { name: "Retomar", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(
    page.getByText("A tela ficou em segundo plano.", { exact: false }),
  ).toBeVisible();
});

test("retomada após pausa mantém repetições reduzidas nas próximas sessões", async ({
  page,
}) => {
  await setup(page);
  await go(page, "configuracoes");
  const data = await getData(page);
  const date = new Date();
  date.setDate(date.getDate() - 20);
  const previousDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  data.reps = 12;
  data.sessions = [
    {
      id: "before-break",
      planId: "before-break",
      date: previousDate,
      kind: "A",
      started: 1,
      ended: 2,
      partial: false,
      steps: 14,
      effort: "Moderado",
      pain: false,
      readiness: "Disposta",
      reps: 12,
      resistance: "Peso corporal",
      notes: "",
    },
  ];
  await page.getByLabel("Restaurar backup").setInputFiles({
    name: "retomada.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(data)),
  });
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Confirmar substituição" }).click();
  await expect(
    page.getByRole("heading", { name: /Vamos juntas/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Iniciar treino", exact: true })
    .click();
  await expect(
    page.getByText("Retomada gradual após pausa:", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirmar e iniciar" }).click();
  await expect(
    page.getByRole("heading", { name: "Prepare seu espaço" }),
  ).toBeVisible();
  const resumed = await getData(page);
  expect(resumed.reps).toBe(5);
  expect((resumed.active as Record<string, unknown>).reps).toBe(5);
  expect((resumed.active as Record<string, unknown>).short).toBe(true);
  await page
    .getByRole("button", { name: "Encerrar e registrar parcial" })
    .click();
  await page.getByRole("button", { name: "Salvar registro parcial" }).click();
  await expect(page.getByRole("heading", { name: "Evolução." })).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Atual: 5 repetições", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Confirmar +1 repetição" }),
  ).toHaveCount(0);
});

test("pausa, recarga e registro parcial sem duplicação", async ({ page }) => {
  await setup(page);
  await go(page, "hoje");
  await page
    .getByRole("button", { name: "Iniciar treino", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirmar e iniciar" }).click();
  await expect(
    page.getByRole("heading", { name: "Prepare seu espaço" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Retomar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pausar", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pausar", exact: true }).click();
  await page.getByRole("button", { name: "Próxima etapa" }).click();
  await expect(
    page.getByRole("heading", { name: "Solte o corpo" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Solte o corpo" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Retomar", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Encerrar e registrar parcial" })
    .click();
  await page.getByRole("button", { name: "Salvar registro parcial" }).click();
  await expect(
    page.getByRole("heading", { name: "Sessão A · parcial" }),
  ).toBeVisible();
  let d = await getData(page);
  expect((d.sessions as unknown[]).length).toBe(1);
  await page.reload();
  d = await getData(page);
  expect((d.sessions as unknown[]).length).toBe(1);
});
