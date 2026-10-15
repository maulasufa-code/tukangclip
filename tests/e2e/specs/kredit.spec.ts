import { test, expect } from "@playwright/test";

test("kredit butuh login", async ({ page }) => {
  await page.goto("/kredit");
  await expect(page).toHaveURL(/masuk/);
});
