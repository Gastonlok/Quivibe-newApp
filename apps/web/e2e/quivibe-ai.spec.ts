import { expect, test } from "@playwright/test";

test("AI retains context, displays explanations, and links to the booking form", async ({ page }) => {
  const requests: Record<string, unknown>[] = [];
  await page.route("**/api/quivibe-ai", async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({ json: {
      message: "Je regarderais Adresse A.\n\nSon cadre est calme, d’après sa description.",
      context: { occasion: "romantique", budget: "low", neighborhood: "gombe", partySize: 6 },
      recommendations: [{ id: "a", slug: "adresse-a", name: "Adresse A", category: "Restaurant", neighborhood: "Gombe", priceRange: 2, rating: 4, image: null, imageAlt: "", description: "Calme", reservationsEnabled: true, amenities: [], reason: "Cadre calme selon la description." }],
    } });
  });
  await page.goto("/map");
  const input = page.getByRole("textbox", { name: "Ton message à Quivibe AI" });
  await input.fill("Un endroit romantique");
  await page.getByRole("button", { name: "Trouver ma vibe" }).click();
  await expect(page.getByRole("log")).toContainText("Son cadre est calme");
  await expect(input).toHaveValue("");
  await input.fill("Pas trop cher");
  await page.getByRole("button", { name: "Trouver ma vibe" }).click();
  await expect.poll(() => requests.length).toBe(2);
  expect(requests[1].context).toMatchObject({ occasion: "romantique", partySize: 6 });
  expect(requests[1].previousIds).toEqual(["a"]);
  await expect(page.getByRole("link", { name: "Réserver", exact: true })).toHaveAttribute("href", "/places/adresse-a?partySize=6#reservation");
});

test("AI shows generation state, prevents duplicate sends and preserves input on failure", async ({ page }) => {
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/quivibe-ai", async (route) => {
    await gate;
    await route.fulfill({ status: 503, json: { error: "Réessaie dans un instant." } });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/map");
  const input = page.getByRole("textbox", { name: "Ton message à Quivibe AI" });
  await input.fill("Un resto");
  await page.getByRole("button", { name: "Trouver ma vibe" }).click();
  await expect(page.getByText("Quivibe AI réfléchit…")).toBeVisible();
  await expect(page.getByRole("button", { name: "Un dîner romantique", exact: true })).toBeDisabled();
  release();
  await expect(input).toHaveValue("Un resto");
  await expect(page.getByRole("log")).toContainText("Réessaie dans un instant.");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
