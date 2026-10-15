import { test, expect } from "@playwright/test";

test("akun butuh login", async ({ page }) => {
  await page.goto("/akun");
  await expect(page).toHaveURL(/masuk/);
});
