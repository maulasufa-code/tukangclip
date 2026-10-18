import { expect, test } from "@playwright/test";

// Landing publik: semantik, tautan, tata letak mobile, dan target sentuh.

test.describe("landing desktop", () => {
  test("hero, anchor, dan canvas tampil tanpa error", async ({ page }) => {
    const error: string[] = [];
    page.on("pageerror", (e) => error.push(e.message));

    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Satu video panjang");
    await expect(page.locator("canvas").first()).toBeAttached();

    for (const href of ["#alur", "#harga", "#clipper", "#faq"]) {
      await expect(page.locator(`a[href="${href}"]`).first()).toBeVisible();
      await expect(page.locator(href)).toHaveCount(1);
    }

    expect(error).toEqual([]);
  });

  test("semantik: satu h1, landmark main dan footer", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("main#isi")).toHaveCount(1);
    await expect(page.locator("footer")).toHaveCount(1);
    await expect(page.locator("header")).toHaveCount(1);
  });
});

test.describe("landing mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("tanpa scroll horizontal dan target sentuh minimal 44px", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const lebar = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      klien: document.documentElement.clientWidth
    }));
    expect(lebar.scroll).toBeLessThanOrEqual(lebar.klien);

    const kecil = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>("header a, header button, main a, main button, footer a"))
        .filter((el) => el.offsetParent !== null)
        .filter((el) => el.getBoundingClientRect().height < 44)
        .map((el) => (el.textContent ?? "").trim())
    );
    expect(kecil).toEqual([]);
  });
});
