import { beforeEach, expect, it, vi } from "vitest";

const { state, findUnique, rawAuth, compare } = vi.hoisted(() => ({
  state: { config: {} as Record<string, unknown> },
  findUnique: vi.fn(), rawAuth: vi.fn(), compare: vi.fn(),
}));
vi.mock("next-auth", () => ({
  default: (config: Record<string, unknown>) => { state.config = config; return { handlers: {}, signIn: vi.fn(), signOut: vi.fn(), auth: rawAuth }; },
  CredentialsSignin: class extends Error { code = "credentials"; },
}));
vi.mock("next-auth/providers/credentials", () => ({ default: (options: unknown) => options }));
vi.mock("bcryptjs", () => ({ default: { compare } }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique } } }));
import { auth } from "@/lib/auth";

beforeEach(() => vi.clearAllMocks());
it("returns no server session for a revoked or deleted identity", async () => {
  rawAuth.mockResolvedValue({ user: { id: "", role: "DISABLED" } });
  expect(await auth()).toBeNull();
  rawAuth.mockResolvedValue(null);
  expect(await auth()).toBeNull();
});
it("clears an existing session when its account is suspended", async () => {
  const callback = (state.config.callbacks as { session: (args: unknown) => Promise<{ user: { id: string; role: string } }> }).session;
  findUnique.mockResolvedValue({ id: "admin", role: "ADMIN", suspendedAt: new Date() });
  const result = await callback({ session: { user: { id: "admin", role: "ADMIN" } }, token: { id: "admin" } });
  expect(result.user).toMatchObject({ id: "", role: "DISABLED" });
});
it("does not allow a suspended account to authenticate with valid credentials", async () => {
  const provider = (state.config.providers as { authorize: (input: unknown) => Promise<unknown> }[])[0];
  findUnique.mockResolvedValue({ id: "admin", role: "ADMIN", passwordHash: "hash", suspendedAt: new Date() });
  expect(await provider.authorize({ email: "admin@example.test", password: "Password123!" })).toBeNull();
  expect(compare).not.toHaveBeenCalled();
});
