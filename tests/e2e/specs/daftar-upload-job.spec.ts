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

test("menu beranda terbuka dan tertutup dengan Escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 });
  await page.goto("/");
  const tombol = page.getByRole("button", { name: /buka menu/i });
  await expect(tombol).toHaveAttribute("aria-expanded", "false");
  await tombol.click();
  const menu = page.locator("#menu-situs");
  await expect(menu).toBeVisible();
  await expect(
    page.getByRole("button", { name: /tutup menu/i })
  ).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(page.locator("#menu-situs")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /buka menu/i })).toBeFocused();
});

test("beranda tidak meluber di semua lebar", async ({ page }) => {
  await page.goto("/");
  for (const lebar of [320, 390, 768, 1024, 1280]) {
    await page.setViewportSize({ width: lebar, height: 800 });
    const sisa = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
    );
    expect(sisa, `lebar ${lebar}px`).toBeLessThanOrEqual(0);
  }
});

test("setiap anchor beranda punya section tujuan", async ({ page }) => {
  await page.goto("/");
  const anchor = await page
    .locator('a[href^="#"]')
    .evaluateAll((el) => el.map((e) => e.getAttribute("href") ?? ""));
  expect(anchor.length).toBeGreaterThan(0);
  for (const tujuan of anchor) {
    await expect(page.locator(tujuan)).toHaveCount(1);
  }
});
