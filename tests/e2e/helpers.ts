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

// Mantém a URL da versão simulada nas próximas aberturas; assim o teste não
// cria uma segunda atualização artificial ao voltar ao endereço canônico.
export async function queueUpdate(page: Page, workerUrl: string) {
  await page.addInitScript((url) => {
    sessionStorage.setItem(
      "test-update-openings",
      String(Number(sessionStorage.getItem("test-update-openings") || 0) + 1),
    );
    const register = navigator.serviceWorker.register.bind(
      navigator.serviceWorker,
    );
    navigator.serviceWorker.register = (script, options) =>
      register(
        String(script).includes("/GForce/sw.js") ? url : script,
        options,
      );
  }, workerUrl);
  await page.evaluate(async (url) => {
    sessionStorage.setItem("test-update-openings", "0");
    const r = await navigator.serviceWorker.register(url, {
      updateViaCache: "none",
    });
    await new Promise<void>((resolve) => {
      if (r.waiting) return resolve();
      const worker = r.installing;
      if (!worker || worker.state === "installed") return resolve();
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed") resolve();
      });
    });
  }, workerUrl);
}

export async function expectAutomaticReload(page: Page) {
  await expect
    .poll(async () => {
      try {
        return await page.evaluate(() =>
          Number(sessionStorage.getItem("test-update-openings")),
        );
      } catch {
        return 0;
      } // O contexto anterior desaparece durante a recarga automática.
    })
    .toBeGreaterThanOrEqual(2);
}
