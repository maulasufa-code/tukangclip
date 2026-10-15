import { test, expect } from "@playwright/test";

test("keamanan butuh login", async ({ page }) => {
  await page.goto("/keamanan");
  await expect(page).toHaveURL(/masuk/);
});
