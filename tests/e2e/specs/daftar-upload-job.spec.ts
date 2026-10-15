import { test, expect } from "@playwright/test";

test("beranda memuat tautan nyata", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /potong video/i })).toBeVisible();
  const unggah = page.getByRole("link", { name: /unggah video panjang/i });
  await expect(unggah).toHaveAttribute("href", "/unggah");
  await unggah.click();
  await expect(page).toHaveURL(/masuk|unggah/);
});

test("daftar menolak tanpa email", async ({ page }) => {
  await page.goto("/daftar");
  const tombol = page.getByRole("button", { name: /buat akun/i });
  await expect(tombol).toBeVisible();
  await tombol.click();
  await expect(page.getByLabel(/email/i)).toBeVisible();
});

test("unggah butuh login", async ({ page }) => {
  await page.goto("/unggah");
  await expect(page).toHaveURL(/masuk/);
});
