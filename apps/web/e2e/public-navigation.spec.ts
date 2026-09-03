import { expect, test } from "@playwright/test";

test("a visitor can reach the main discovery routes", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Quivibe/i);
  await page.goto("/discover");
  await expect(page).toHaveURL(/\/discover/);
});

test("profile is protected for anonymous visitors", async ({ page }) => {
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fprofile/);
});

test("a visitor can search from the discovery page", async ({ page }) => {
  await page.goto("/discover");
  await page.locator('input[name="search"]').fill("restaurant");
  await page.getByRole("button", { name: "Rechercher" }).click();
  await expect(page).toHaveURL(/\/discover\?search=restaurant/);
});
