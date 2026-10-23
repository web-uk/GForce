import { mkdir, writeFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";

const base = process.env.GFORCE_URL || "https://web-uk.github.io/GForce/";
const out = "test-results/published";
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  locale: "pt-BR",
  timezoneId: "America/Sao_Paulo",
});
const page = await context.newPage();
page.setDefaultTimeout(20000);
const errors = [];
const missing = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("response", (r) => {
  if (r.status() >= 400 && r.url().startsWith(base))
    missing.push({ status: r.status(), url: r.url() });
});
try {
  const response = await page.goto(base, { waitUntil: "networkidle" });
  expect(response.status()).toBe(200);
  await expect(page).toHaveTitle("GForce · no seu ritmo");
  await expect(page.getByRole("heading", { name: "Sua força começa aqui." })).toBeVisible();
  await page.screenshot({ path: out + "/primeiro-acesso.png" });
  await page.getByLabel("Senha", { exact: true }).fill("Auditoria-GForce-2026");
  await page.getByLabel("Confirme a senha", { exact: true }).fill("Auditoria-GForce-2026");
  await page.getByRole("button", { name: "Criar senha e começar" }).click();
  await page.getByLabel("Faixa etária").selectOption("18–39");
  await page.getByRole("combobox", { name: "Experiência", exact: true }).selectOption("Iniciante");
  await page.getByLabel("Gestação ou recuperação de parto").selectOption("Não se aplica");
  await page.getByLabel("Sintomas pélvicos:").selectOption("Não percebo esses sintomas");
  await page.getByRole("button", { name: "Salvar meu perfil" }).click();
  await expect(page.getByRole("heading", { name: /Vamos juntas/ })).toBeVisible();
  await page.getByRole("button", { name: "Iniciar treino", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar e iniciar" }).click();
  await expect(page.getByRole("heading", { name: "Prepare seu espaço" })).toBeVisible();
  await page.getByRole("button", { name: "Próxima etapa" }).click();
  await expect(page.getByRole("heading", { name: "Solte o corpo" })).toBeVisible();
  await page.getByRole("button", { name: "Próxima etapa" }).click();
  await expect(page.getByRole("heading", { name: "Sentar e levantar" })).toBeVisible();
  await page.screenshot({ path: out + "/treino-390x844.png", fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: out + "/treino-1440x900.png", fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const manifest = await page.evaluate(async () =>
    (await fetch(new URL("manifest.webmanifest", location.href.split("#")[0]))).json()
  );
  expect(manifest.scope).toBe("/GForce/");
  expect(manifest.start_url).toBe("/GForce/");
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload({ waitUntil: "networkidle" });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Sentar e levantar" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Retomar", exact: true })).toBeVisible();
  await context.setOffline(false);
  expect(errors).toEqual([]);
  expect(missing).toEqual([]);
  const report = {
    url: base, http: response.status(), title: await page.title(),
    mobile: "390x844", desktop: "1440x900", profile: "synthetic",
    offline: true, manifestScope: manifest.scope,
    pageErrors: errors, missingAssets: missing,
  };
  await writeFile(out + "/report.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
