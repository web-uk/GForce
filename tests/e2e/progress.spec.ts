import { test, expect } from "@playwright/test";
import { setup, go, getData, testPassword } from "./helpers";
test("restauração válida, progressão, redução e acesso lembrado", async ({
  page,
}) => {
  await setup(page);
  await go(page, "configuracoes");
  const data = await getData(page);
  const date = new Date();
  const today = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const session = {
    date: today,
    kind: "A",
    started: 1,
    ended: 2,
    partial: false,
    steps: 14,
    effort: "Moderado",
    pain: false,
    readiness: "Disposta",
    reps: 5,
    resistance: "Peso corporal",
    notes: "<script>window.injected=true</script>",
  };
  data.sessions = [
    { ...session, id: "s1", planId: "p1" },
    { ...session, id: "s2", planId: "p2" },
  ];
  await page.getByLabel("Restaurar backup").setInputFiles({
    name: "restore.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(data)),
  });
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Confirmar substituição" }).click();
  await expect(
    page.getByRole("heading", { name: /Vamos juntas/ }),
  ).toBeVisible();
  await go(page, "evolucao");
  await expect(
    page.getByRole("button", { name: "Confirmar +1 repetição" }),
  ).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Confirmar +1 repetição" }).click();
  await expect(
    page.getByRole("button", { name: "Confirmar +1 repetição" }),
  ).toHaveCount(0);
  expect((await getData(page)).reps).toBe(6);
  await page.getByRole("button", { name: "Reduzir uma repetição" }).click();
  await expect(
    page.getByText("Atual: 5 repetições", { exact: false }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => Reflect.get(window, "injected")),
  ).toBeUndefined();
  await go(page, "configuracoes");
  await expect(
    page.getByText("A senha é única.", { exact: false }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Configurações." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Bloquear agora", exact: true })
    .last()
    .click();
  await page.getByLabel("Senha", { exact: true }).fill(testPassword);
  await page.getByRole("button", { name: "Desbloquear" }).click();
  await expect(
    page.getByRole("heading", { name: "Configurações." }),
  ).toBeVisible();
});
