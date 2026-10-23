import { test, expect } from "@playwright/test";
import { setup, go, getData } from "./helpers";
test("ativação de avisos é opcional e não pergunta novamente após consentimento", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["notifications"]);
  await page.addInitScript(() => {
    Object.defineProperty(Notification, "permission", {
      configurable: true,
      get: () =>
        sessionStorage.getItem("test-notification-permission") || "default",
    });
    Notification.requestPermission = async () => {
      sessionStorage.setItem("test-notification-permission", "granted");
      sessionStorage.setItem(
        "test-notification-prompts",
        String(
          Number(sessionStorage.getItem("test-notification-prompts") || 0) + 1,
        ),
      );
      Reflect.set(
        window,
        "nativePromptHadUserActivation",
        navigator.userActivation.isActive,
      );
      return "granted";
    };
    ServiceWorkerRegistration.prototype.showNotification = async function (
      title,
      options,
    ) {
      Reflect.set(window, "localNotificationTest", {
        title,
        body: options?.body,
      });
    };
  });
  let sdkLoads = 0;
  await page.route("https://cdn.onesignal.com/**", async (route) => {
    sdkLoads++;
    await route.fulfill({
      contentType: "application/javascript",
      body: `
      const sdk = {init:async options=>{window.pushTestOptions=options},setConsentRequired:()=>{},setConsentGiven:()=>{},Notifications:{requestPermission:async()=>{await Notification.requestPermission()},permission:true},User:{addTags:async tags=>{window.pushTestTags=tags},PushSubscription:{id:'synthetic',optedIn:true,optIn:async()=>{},optOut:async()=>{}}}};
      for(const callback of window.OneSignalDeferred || []) callback(sdk);
      window.OneSignalDeferred={push:callback=>{callback(sdk);return 1}};
    `,
    });
  });
  await setup(page, true);
  await page.screenshot({
    path: `test-results/notification-invite-${page.viewportSize()?.width}.png`,
    fullPage: true,
  });
  expect(sdkLoads).toBe(0);
  await page
    .getByRole("button", { name: "Ativar notificações", exact: true })
    .click();
  const confirmation = page.getByRole("button", {
    name: "Permitir neste aparelho",
    exact: true,
  });
  await expect(
    confirmation
      .or(page.getByText("PERMISSÃO SALVA NESTE APARELHO", { exact: true }))
      .or(page.getByText("WEB PUSH CONECTADO", { exact: true })),
  ).toBeVisible();
  if (await confirmation.isVisible()) await confirmation.click();
  await expect(
    page
      .getByText("PERMISSÃO SALVA NESTE APARELHO", { exact: true })
      .or(page.getByText("WEB PUSH CONECTADO", { exact: true })),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: /Vamos juntas/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Quer receber um lembrete gentil?" }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("test-notification-prompts"),
    ),
  ).toBe("1");
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("gforce-notifications")!),
  );
  expect(stored.decision).toBe("enabled");
  await go(page, "configuracoes");
  await expect(
    page.getByRole("heading", { name: "Notificações e carinho no dia" }),
  ).toBeVisible();
  await page.getByLabel("Cuidado com alimentação", { exact: true }).uncheck();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("gforce-notifications")!).food,
    ),
  ).toBe(false);
  const tags = await page.evaluate(() => Reflect.get(window, "pushTestTags"));
  if (tags) {
    const options = await page.evaluate(() =>
      Reflect.get(window, "pushTestOptions"),
    );
    expect(options.serviceWorkerPath).toBe("GForce/push/OneSignalSDKWorker.js");
    expect(options.serviceWorkerParam.scope).toBe("/GForce/push/");
    expect(options.requiresUserPrivacyConsent).toBe(true);
    expect(Object.keys(tags).sort()).toEqual([
      "gforce_care",
      "gforce_enabled",
      "gforce_food",
      "gforce_training",
    ]);
  }
  await page
    .getByRole("button", { name: "Desativar notificações", exact: true })
    .click();
  await expect(
    page.getByText("Avisos desativados.", { exact: false }),
  ).toBeVisible();
  await go(page, "hoje");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Quer receber um lembrete gentil?" }),
  ).toHaveCount(0);
});

test("permissão bloqueada não repete pedido e migração preserva acesso e registros", async ({
  page,
}) => {
  await setup(page, true);
  await page.evaluate(() =>
    Object.defineProperty(Notification, "permission", {
      configurable: true,
      get: () => "denied",
    }),
  );
  await page
    .getByRole("button", { name: "Ativar notificações", exact: true })
    .click();
  await expect(
    page.getByText("Os avisos estão bloqueados", { exact: false }),
  ).toBeVisible();
  const before = await getData(page);
  await page.evaluate(() =>
    localStorage.setItem(
      "gforce-access",
      JSON.stringify({
        salt: [1],
        hash: [1],
        iterations: 600000,
        remember: true,
        each: true,
      }),
    ),
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: /Vamos juntas/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Quer receber um lembrete gentil?" }),
  ).toHaveCount(0);
  expect((await getData(page)).profile).toEqual(before.profile);
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("gforce-access")!),
    ),
  ).toEqual({ version: 2, remember: true });
});
