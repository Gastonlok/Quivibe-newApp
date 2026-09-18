import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  access: vi.fn(),
  place: vi.fn(),
  lock: vi.fn(),
  media: vi.fn(),
  reset: vi.fn(),
  select: vi.fn(),
  transaction: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("./access", () => ({
  getPlaceAccess: mocks.access,
  canManageCollaborators: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    place: { findUnique: mocks.place },
    $transaction: mocks.transaction,
  },
}));

import { setOwnerPlaceFeaturedImageAction } from "./actions";

describe("featured establishment image", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "owner" } });
    mocks.access.mockResolvedValue("OWNER");
    mocks.place.mockResolvedValue({ id: "place", slug: "restaurant" });
    mocks.media.mockResolvedValue({ id: "photo" });
    mocks.transaction.mockImplementation(async (run) =>
      run({
        place: { update: mocks.lock },
        media: {
          findFirst: mocks.media,
          updateMany: mocks.reset,
          update: mocks.select,
        },
      }),
    );
  });

  it("rejects unauthenticated visitors before writing", async () => {
    mocks.auth.mockResolvedValue(null);
    expect(
      (await setOwnerPlaceFeaturedImageAction("place", "photo")).success,
    ).toBe(false);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejects users without access to the establishment", async () => {
    mocks.access.mockResolvedValue(null);
    expect(
      (await setOwnerPlaceFeaturedImageAction("place", "photo")).success,
    ).toBe(false);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejects a missing photo or one belonging to another establishment", async () => {
    mocks.media.mockResolvedValue(null);
    expect(
      (await setOwnerPlaceFeaturedImageAction("place", "foreign-photo"))
        .success,
    ).toBe(false);
    expect(mocks.media).toHaveBeenCalledWith({
      where: { id: "foreign-photo", placeId: "place" },
      select: { id: true },
    });
    expect(mocks.reset).not.toHaveBeenCalled();
    expect(mocks.select).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it.each(["OWNER", "ADMIN", "MANAGER", "EDITOR"])(
    "allows an authorized %s to replace the cover atomically",
    async (access) => {
      mocks.access.mockResolvedValue(access);
      expect(await setOwnerPlaceFeaturedImageAction("place", "photo")).toEqual({
        success: true,
      });
      expect(mocks.transaction).toHaveBeenCalledOnce();
      expect(mocks.lock.mock.invocationCallOrder[0]).toBeLessThan(
        mocks.reset.mock.invocationCallOrder[0],
      );
      expect(mocks.reset).toHaveBeenCalledWith({
        where: { placeId: "place", sortOrder: { not: 0 } },
        data: { sortOrder: 0 },
      });
      expect(mocks.select).toHaveBeenCalledWith({
        where: { id: "photo", placeId: "place" },
        data: { sortOrder: -1 },
      });
      expect(mocks.revalidate).toHaveBeenCalledWith(`/places/restaurant`);
    },
  );

  it("reports a failed transaction without claiming success or refreshing the page", async () => {
    mocks.transaction.mockRejectedValue(new Error("Database unavailable"));
    expect(
      (await setOwnerPlaceFeaturedImageAction("place", "photo")).success,
    ).toBe(false);
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
