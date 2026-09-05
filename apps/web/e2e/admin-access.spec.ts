import { expect, test } from "@playwright/test";

test("admin workspace requires a login", async ({ page }) => {
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fadmin%2Fdashboard/);
});

test("anonymous callers cannot administer accounts or send messages", async ({ request }) => {
  test.setTimeout(90000);
  for (const path of ["/api/admin/users", "/api/admin/messages", "/api/admin/events", "/api/admin/categories"]) {
    expect((await request.get(path)).status()).toBe(403);
  }
  expect((await request.post("/api/admin/messages", { data: { subject: "Unauthorized", body: "Blocked" } })).status()).toBe(403);
  expect((await request.post("/api/admin/messages/deliver")).status()).toBe(403);
  expect((await request.post("/api/email/test")).status()).toBe(403);
  expect((await request.get("/api/email/test")).status()).toBe(405);
});

test("inbox and email cron are private", async ({ request }) => {
  expect((await request.get("/api/messages")).status()).toBe(401);
  expect((await request.patch("/api/messages", { data: { id: "not-owned" } })).status()).toBe(401);
  expect((await request.get("/api/cron/admin-messages")).status()).toBe(403);
});
