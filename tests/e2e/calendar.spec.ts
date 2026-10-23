import { test, expect } from "@playwright/test";
import { setup, go } from "./helpers";
test("reagendamento preserva intervalo entre sessões", async ({ page }) => {
  await setup(page);
  await go(page, "semana");
  const dates = page.locator("input[type=date]");
  const value = await dates.nth(3).inputValue();
  await dates.nth(3).fill(await dates.nth(1).inputValue());
  await expect(page.getByRole("status")).toContainText(
    "Mantenha ao menos um dia",
  );
  await expect(dates.nth(3)).toHaveValue(value);
});
