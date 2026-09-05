import { afterEach, expect, it, vi } from "vitest";
import { isMenuImageContent, isMenuImageForPlace } from "./menu-image";
afterEach(() => vi.unstubAllEnvs());
it("accepts only photos uploaded for the current establishment", () => {
  vi.stubEnv("CLOUDINARY_CLOUD_NAME", "test-cloud");
  const valid =
    "https://res.cloudinary.com/test-cloud/image/upload/v123/quivibe/menus/place1/photo.webp";
  expect(isMenuImageForPlace(valid, "place1")).toBe(true);
  expect(isMenuImageForPlace(valid, "place2")).toBe(false);
  for (const invalid of [
    valid.replace("https:", "http:"),
    valid.replace("test-cloud", "another-cloud"),
    valid.replace("res.cloudinary.com", "res.cloudinary.com.evil.test"),
    `${valid}?other=1`,
    valid.replace("photo.webp", "../../places/photo.webp"),
  ])
    expect(isMenuImageForPlace(invalid, "place1")).toBe(false);
});
it("checks the bytes instead of trusting the declared file type", () => {
  expect(
    isMenuImageContent(
      new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
      "image/png",
    ),
  ).toBe(true);
  expect(
    isMenuImageContent(
      new TextEncoder().encode("<svg>unsafe</svg>"),
      "image/png",
    ),
  ).toBe(false);
  expect(
    isMenuImageContent(new Uint8Array([255, 216, 255]), "image/jpeg"),
  ).toBe(true);
});
