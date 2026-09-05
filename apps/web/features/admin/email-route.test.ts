import { expect, it, vi } from "vitest";
const { actor, send, auth } = vi.hoisted(() => ({ actor: vi.fn(), send: vi.fn(), auth: vi.fn() }));
vi.mock("@/features/admin/access", () => ({ getAdminActor: actor }));
vi.mock("@/lib/auth", () => ({ auth }));
vi.mock("@/lib/email", () => ({ sendTestEmail: send }));
import { POST } from "../../app/api/email/test/route";
it("blocks public test-email sending", async () => {
  actor.mockResolvedValue(null);
  expect((await POST()).status).toBe(403);
  expect(send).not.toHaveBeenCalled();
});
it("reports provider failure and uses the admin's own address", async () => {
  actor.mockResolvedValue({ id: "admin" });
  auth.mockResolvedValue({ user: { email: "admin@example.test" } });
  send.mockResolvedValue({ success: false });
  expect((await POST()).status).toBe(503);
  expect(send).toHaveBeenCalledWith("admin@example.test");
});
