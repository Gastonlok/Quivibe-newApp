import { expect, test, type Page } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL || "admin@quivibe.com";
const adminPassword = process.env.E2E_ADMIN_PASSWORD || "QuivibeDemo2026!";

async function signInAsAdmin(page: Page) {
  await page.goto("/login?callbackUrl=%2Fprofile");
  const loginForm = page.locator('form:has(input[type="email"])');
  await loginForm.locator('input[type="email"]').fill(adminEmail);
  await loginForm.locator('input[type="password"]').fill(adminPassword);
  await loginForm.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/profile/);
}

test.describe("authenticated critical routes", () => {
  test("an administrator can view their profile and reservations", async ({ page }) => {
    await signInAsAdmin(page);
    await expect(page.getByRole("heading", { name: /mon profil/i })).toBeVisible();

    await page.goto("/reservations");
    await expect(page.getByRole("heading", { name: /mes r.servations/i })).toBeVisible();
  });

  test("an administrator can read moderation data without changing it", async ({ page }) => {
    await signInAsAdmin(page);
    const response = await page.request.get("/api/admin/reviews");
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.reviews).toEqual(expect.any(Array));
  });
});
