import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  findUnique: vi.fn(),
  deleteMany: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: { session: mocks } }));
import {
  issueSession,
  readSession,
  revokeSession,
  tokenHash,
  allowLogin,
} from "./session";
import { mobileIdentity } from "./context";
const token = "qvm_" + "a".repeat(64);
const request = (authorization?: string) =>
  new Request("http://localhost/api/mobile/session", {
    headers: authorization ? { authorization } : {},
  });
beforeEach(() => vi.clearAllMocks());
describe("native shared-account sessions", () => {
  it("stores only a digest and emits independent random tokens", async () => {
    const a = await issueSession("user1"),
      b = await issueSession("user1");
    expect(a.token).toMatch(/^qvm_[a-f0-9]{64}$/);
    expect(a.token).not.toEqual(b.token);
    expect(mocks.create.mock.calls[0][0].data).toMatchObject({
      userId: "user1",
      sessionToken: tokenHash(a.token),
    });
    expect(JSON.stringify(mocks.create.mock.calls)).not.toContain(a.token);
  });
  it("requires a Bearer credential, not a cookie or raw token", async () => {
    expect(await readSession(request())).toBeNull();
    expect(await readSession(request(token))).toBeNull();
    expect(await readSession(request("Basic " + token))).toBeNull();
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });
  it("rejects revoked, expired and suspended accounts", async () => {
    const req = request("Bearer " + token);
    mocks.findUnique.mockResolvedValue(null);
    expect(await readSession(req)).toBeNull();
    mocks.findUnique.mockResolvedValue({ expires: new Date(0), user: {} });
    expect(await readSession(req)).toBeNull();
    mocks.findUnique.mockResolvedValue({
      expires: new Date(Date.now() + 60000),
      user: { suspendedAt: new Date() },
    });
    expect(await readSession(req)).toBeNull();
  });
  it("returns only public session identity", async () => {
    mocks.findUnique.mockResolvedValue({
      expires: new Date(Date.now() + 60000),
      user: {
        id: "user1",
        name: "User",
        email: "u@test.example",
        role: "USER",
        image: null,
        suspendedAt: null,
        moderationPermissions: [],
      },
    });
    const session = await readSession(request("Bearer " + token));
    expect(session?.user.id).toBe("user1");
    expect(session?.user).not.toHaveProperty("suspendedAt");
  });
  it("revokes only the hashed native credential", async () => {
    await revokeSession(request("Bearer " + token));
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: { sessionToken: tokenHash(token) },
    });
  });
  it("limits repeated attempts and resets after the interval", () => {
    for (let n = 0; n < 10; n++)
      expect(allowLogin("test-limit", 100)).toBe(true);
    expect(allowLogin("test-limit", 100)).toBe(false);
    expect(allowLogin("test-limit", 900101)).toBe(true);
  });
  it("isolates concurrent mobile identities and does not leak into web requests", async () => {
    expect(mobileIdentity.getStore()).toBeUndefined();
    const identity = (id: string) =>
      ({ user: { id }, expires: "" }) as Parameters<
        typeof mobileIdentity.run
      >[0];
    const values = await Promise.all(
      ["a", "b"].map((id) =>
        mobileIdentity.run(identity(id), async () => {
          await new Promise((resolve) =>
            setTimeout(resolve, id === "a" ? 10 : 1),
          );
          return mobileIdentity.getStore()?.user.id;
        }),
      ),
    );
    expect(values).toEqual(["a", "b"]);
    expect(mobileIdentity.getStore()).toBeUndefined();
  });
});
