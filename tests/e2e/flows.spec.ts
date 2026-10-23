import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
async function setup(page: Page) {
  await page.goto("./");
  await page.getByLabel("Senha", { exact: true }).fill("GForce-teste-2026");
  await page
    .getByLabel("Confirme a senha", { exact: true })
    .fill("GForce-teste-2026");
  await page.getByRole("button", { name: "Criar senha e começar" }).click();
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
}
async function go(page: Page, route: string) {
  await page.goto("./#/" + route);
}
async function getData(page: Page) {
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
test("senha, persistência, treino parcial, backup e exclusão", async ({
  page,
}) => {
  await setup(page);
  await go(page, "configuracoes");
  await page
    .getByRole("button", { name: "Bloquear agora", exact: true })
    .last()
    .click();
  await page.getByLabel("Senha", { exact: true }).fill("senha-errada");
  await page.getByRole("button", { name: "Desbloquear" }).click();
  await expect(page.getByRole("alert")).toContainText("Senha incorreta");
  await page.getByLabel("Senha", { exact: true }).fill("GForce-teste-2026");
  await page.getByRole("button", { name: "Desbloquear" }).click();
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
  await go(page, "configuracoes");
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Exportar dados / backup JSON" })
    .click();
  expect((await download).suggestedFilename()).toMatch(/GForce-backup/);
  await page.getByLabel("Restaurar backup").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":99}'),
  });
  await expect(page.getByRole("status")).toContainText("Backup inválido");
  d = await getData(page);
  await page.getByLabel("Restaurar backup").setInputFiles({
    name: "valid.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(d)),
  });
  await expect(page.getByText("Revise antes de substituir")).toBeVisible();
  await page.getByRole("button", { name: "Cancelar restauração" }).click();
  await page
    .getByRole("button", { name: "Excluir todos os dados e reinicializar" })
    .click();
  await expect(
    page.getByRole("button", { name: "Apagar definitivamente" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await page
    .getByRole("button", { name: "Excluir todos os dados e reinicializar" })
    .click();
  await page.getByLabel("Senha atual").fill("GForce-teste-2026");
  await page.getByLabel("Digite APAGAR").fill("APAGAR");
  await page.getByRole("button", { name: "Apagar definitivamente" }).click();
  await expect(
    page.getByRole("heading", { name: "Sua força começa aqui." }),
  ).toBeVisible();
});
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
test("layout, biblioteca, teclado e acessibilidade", async ({ page }, info) => {
  await setup(page);
  await expect(page.locator("main")).toBeVisible();
  await page.screenshot({
    path: `test-results/hoje-${info.project.name}.png`,
    fullPage: true,
  });
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
  for (const route of [
    "semana",
    "exercicios",
    "evolucao",
    "alimentacao",
    "configuracoes",
  ]) {
    await go(page, route);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/${route}-${info.project.name}.png`,
      fullPage: true,
    });
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(audit.violations).toEqual([]);
  }
  await go(page, "exercicios");
  await page.getByLabel("Buscar", { exact: true }).fill("parede");
  await expect(
    page.getByRole("heading", { name: "Flexão na parede" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ver como fazer" }).click();
  await expect(
    page.getByRole("link", { name: /Ver demonstração/ }),
  ).toHaveAttribute("href", /nhs/);
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
});
test("reagendamento, refeições, offline e dados preservados após atualização", async ({
  page,
  context,
}) => {
  await setup(page);
  await go(page, "semana");
  const dates = page.locator("input[type=date]");
  const value = await dates.nth(3).inputValue();
  await dates.nth(3).fill(await dates.nth(1).inputValue());
  await expect(page.getByRole("status")).toContainText(
    "Mantenha ao menos um dia",
  );
  await expect(dates.nth(3)).toHaveValue(value);
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
test("indicadores de avaliação bloqueiam geração automática", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByLabel("Senha", { exact: true }).fill("GForce-teste-2026");
  await page.getByLabel("Confirme a senha").fill("GForce-teste-2026");
  await page.getByRole("button", { name: "Criar senha e começar" }).click();
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

test("restauração válida, progressão confirmada, redução e senha a cada abertura", async ({
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
  await page
    .getByLabel("Senha atual", { exact: true })
    .fill("GForce-teste-2026");
  await page.getByLabel("Nova senha", { exact: true }).fill("Nova-GForce-2026");
  await page.getByLabel("Confirme a nova senha").fill("Nova-GForce-2026");
  await page.getByRole("button", { name: "Alterar senha" }).click();
  await expect(page.getByRole("status")).toContainText("Senha alterada");
  await page.getByLabel("Exigir senha a cada abertura").check();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Bem-vinda de volta." }),
  ).toBeVisible();
  await page.getByLabel("Senha", { exact: true }).fill("Nova-GForce-2026");
  await page.getByRole("button", { name: "Desbloquear" }).click();
  await expect(
    page.getByRole("heading", { name: "Configurações." }),
  ).toBeVisible();
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
