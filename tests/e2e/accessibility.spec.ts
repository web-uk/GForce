import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { setup, go } from "./helpers";
test("layout e acessibilidade nas páginas principais", async ({
  page,
}, info) => {
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
});
