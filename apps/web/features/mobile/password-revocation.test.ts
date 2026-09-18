import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  update: vi.fn(),
  deleteMany: vi.fn(),
  transaction: vi.fn(),
  findUnique: vi.fn(),
  consume: vi.fn(),
  auth: vi.fn(),
  hash: vi.fn(),
  compare: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { $transaction: m.transaction, user: { findUnique: m.findUnique } },
}));
vi.mock("@/lib/auth", () => ({ auth: m.auth }));
vi.mock("@/lib/account-tokens", () => ({ consumeAccountToken: m.consume }));
vi.mock("bcryptjs", () => ({ default: { hash: m.hash, compare: m.compare } }));
import { POST as reset } from "@/app/api/auth/reset-password/route";
import { PATCH as change } from "@/app/api/profile/password/route";
beforeEach(() => {
  vi.clearAllMocks();
  m.hash.mockResolvedValue("new-hash");
  m.transaction.mockImplementation((callback) =>
    callback({
      user: { update: m.update },
      session: { deleteMany: m.deleteMany },
    }),
  );
  m.update.mockResolvedValue({ id: "user1" });
});
const request = (data: unknown) =>
  new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify(data),
  });
it("revokes native sessions in the password reset transaction", async () => {
  m.consume.mockResolvedValue("u@example.test");
  expect(
    (await reset(request({ token: "valid", password: "new-password" }))).status,
  ).toBe(200);
  expect(m.transaction).toHaveBeenCalledOnce();
  expect(m.deleteMany).toHaveBeenCalledWith({
    where: { userId: "user1", sessionToken: { startsWith: "mobile:" } },
  });
});
it("does not revoke anything for an invalid reset token", async () => {
  m.consume.mockResolvedValue(null);
  expect(
    (await reset(request({ token: "invalid", password: "new-password" })))
      .status,
  ).toBe(400);
  expect(m.transaction).not.toHaveBeenCalled();
});
it("revokes only the authenticated user sessions after password verification", async () => {
  m.auth.mockResolvedValue({ user: { id: "user1" } });
  m.findUnique.mockResolvedValue({ passwordHash: "old-hash" });
  m.compare.mockResolvedValue(true);
  expect(
    (
      await change(
        request({
          currentPassword: "old-password",
          newPassword: "new-password",
        }),
      )
    ).status,
  ).toBe(200);
  expect(m.deleteMany).toHaveBeenCalledWith({
    where: { userId: "user1", sessionToken: { startsWith: "mobile:" } },
  });
});
it("does not modify credentials when the current password is wrong", async () => {
  m.auth.mockResolvedValue({ user: { id: "user1" } });
  m.findUnique.mockResolvedValue({ passwordHash: "old-hash" });
  m.compare.mockResolvedValue(false);
  expect(
    (
      await change(
        request({ currentPassword: "wrong", newPassword: "new-password" }),
      )
    ).status,
  ).toBe(400);
  expect(m.transaction).not.toHaveBeenCalled();
});
