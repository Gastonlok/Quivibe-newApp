import { beforeEach, expect, it, vi } from "vitest";
const { auth, findMany, updateMany, count } = vi.hoisted(() => ({
  auth: vi.fn(),
  findMany: vi.fn(),
  updateMany: vi.fn(),
  count: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth }));
vi.mock("@/lib/prisma", () => ({
  prisma: { messageRecipient: { findMany, updateMany, count } },
}));
import { GET, PATCH } from "../../app/api/messages/route";
beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ user: { id: "reader" } });
  findMany.mockResolvedValue([]);
  count.mockResolvedValue(0);
});
it("only lists messages belonging to the authenticated recipient", async () => {
  await GET(new Request("http://localhost/api/messages"));
  expect(findMany).toHaveBeenCalledWith(
    expect.objectContaining({ where: { userId: "reader" }, take: 30 }),
  );
});
it("prevents marking someone else's message as read", async () => {
  updateMany.mockResolvedValue({ count: 0 });
  const response = await PATCH(
    new Request("http://localhost/api/messages", {
      method: "PATCH",
      body: JSON.stringify({ id: "other-message" }),
    }),
  );
  expect(response.status).toBe(404);
  expect(updateMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { id: "other-message", userId: "reader" },
    }),
  );
});
it("requires authentication", async () => {
  auth.mockResolvedValue(null);
  expect((await GET(new Request("http://localhost/api/messages"))).status).toBe(
    401,
  );
  expect(findMany).not.toHaveBeenCalled();
});
