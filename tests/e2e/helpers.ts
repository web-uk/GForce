import { expect, type Page } from "@playwright/test";
export const testPassword =
  process.env.GFORCE_TEST_PASSWORD || "GForce-test-access";
export async function setup(page: Page, keepNotificationPrompt = false) {
  await page.goto("./");
  await page.getByLabel("Senha", { exact: true }).fill(testPassword);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.getByLabel("Faixa etária").selectOption("18–39");
  if (!keepNotificationPrompt)
    await page.getByRole("button", { name: "Agora não", exact: true }).click();
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
}
export async function go(page: Page, route: string) {
  await page.goto("./#/" + route);
}
export async function getData(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((res, rej) => {
      const r = indexedDB.open("gforce", 1);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return await new Promise<Record<string, unknown>>((res, rej) => {
      const r = db
        .transaction("records")
        .objectStore("records")
        .get("personal");
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  });
}
