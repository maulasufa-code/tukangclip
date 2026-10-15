import { test, expect } from "@playwright/test";

test("pasar butuh login", async ({ page }) => {
  await page.goto("/pasar");
  await expect(page).toHaveURL(/masuk/);
});

test("kerjaanku butuh login", async ({ page }) => {
  await page.goto("/kerjaanku");
  await expect(page).toHaveURL(/masuk/);
});
