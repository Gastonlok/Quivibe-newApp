import { beforeEach, expect, it, vi } from "vitest";
const { auth, findUnique } = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique } } }));
import { getAdminActor } from "./access";
beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ user: { id: "u", role: "ADMIN" } });
});
it("does not trust an old administrator session after revocation", async () => {
  findUnique.mockResolvedValue({
    id: "u",
    role: "USER",
    suspendedAt: null,
    moderationPermissions: [],
  });
  expect(await getAdminActor("USERS")).toBeNull();
});
it("uses new delegation without requiring a new login", async () => {
  findUnique.mockResolvedValue({
    id: "u",
    role: "USER",
    suspendedAt: null,
    moderationPermissions: ["EVENTS"],
  });
  expect(await getAdminActor("EVENTS")).toMatchObject({ id: "u" });
  expect(await getAdminActor("REVIEWS")).toBeNull();
});
it("denies deleted accounts and avoids querying on anonymous access", async () => {
  findUnique.mockResolvedValue(null);
  expect(await getAdminActor()).toBeNull();
  vi.clearAllMocks();
  auth.mockResolvedValue(null);
  expect(await getAdminActor()).toBeNull();
  expect(findUnique).not.toHaveBeenCalled();
});
