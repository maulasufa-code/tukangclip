import { test, expect } from "@playwright/test";

test("studio butuh login", async ({ page }) => {
  await page.goto("/studio/contoh-id");
  await expect(page).toHaveURL(/masuk/);
});
