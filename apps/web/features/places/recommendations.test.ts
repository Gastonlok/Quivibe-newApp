import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findPlaces: vi.fn(),
  findCategories: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    place: { findMany: mocks.findPlaces },
    category: { findMany: mocks.findCategories },
  },
}));

import { getRecommendations } from "./actions";

describe("homepage recommendations", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.auth.mockResolvedValue(null);
    mocks.findPlaces.mockResolvedValue([]);
    mocks.findCategories.mockResolvedValue([]);
  });

  it("excludes the displayed top-rated places before selecting recommendations", async () => {
    await getRecommendations(["top-1", "top-2", "top-3", "top-4"]);

    expect(mocks.findPlaces).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        status: "APPROVED",
        id: { notIn: ["top-1", "top-2", "top-3", "top-4"] },
      },
    }));
  });

  it("preserves favorite exclusions for signed-in visitors", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "visitor" } });
    await getRecommendations(["top-1"]);

    expect(mocks.findPlaces).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        status: "APPROVED",
        id: { notIn: ["top-1"] },
        favorites: { none: { userId: "visitor" } },
      },
    }));
  });

  it("returns an empty section when no other eligible places remain", async () => {
    expect(await getRecommendations(["only-place"])).toEqual([]);
  });

  it("still supports callers without exclusions", async () => {
    await getRecommendations();
    expect(mocks.findPlaces).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: "APPROVED" },
    }));
  });
});
