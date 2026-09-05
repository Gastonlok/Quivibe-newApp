import { afterEach, beforeEach, expect, it, vi } from "vitest";
const { findMany, updateMany, findUnique, update, send, count } = vi.hoisted(
  () => ({
    findMany: vi.fn(),
    updateMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    send: vi.fn(),
    count: vi.fn().mockResolvedValue(0),
  }),
);
vi.mock("@/lib/prisma", () => ({
  prisma: {
    messageRecipient: { findMany, updateMany, findUnique, update, count },
  },
}));
vi.mock("@/lib/email", () => ({ sendAdminMessageEmail: send }));
import { recipientFilter, deliverAdminEmails } from "./messages";
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("RESEND_API_KEY", "test");
  findMany.mockResolvedValue([{ id: "delivery1", emailFirstAttemptAt: null }]);
  updateMany.mockResolvedValue({ count: 1 });
  update.mockResolvedValue({});
  findUnique.mockResolvedValue({
    user: {
      email: "reader@example.test",
      emailVerified: new Date(),
      suspendedAt: null,
    },
    message: { subject: "Information", body: "Texte" },
  });
  send.mockResolvedValue({ success: true });
});
afterEach(() => vi.unstubAllEnvs());
it("deduplicates selected recipients and excludes suspended accounts", () => {
  expect(recipientFilter("SELECTED", ["a", "a", "b"])).toEqual({
    suspendedAt: null,
    id: { in: ["a", "b"] },
  });
  expect(recipientFilter("OWNER", [])).toEqual({
    suspendedAt: null,
    role: "OWNER",
  });
});
it("keeps the queue untouched when the provider is unavailable", async () => {
  vi.stubEnv("RESEND_API_KEY", "");
  expect((await deliverAdminEmails()).unavailable).toBe(true);
  expect(updateMany).not.toHaveBeenCalled();
  expect(send).not.toHaveBeenCalled();
});
it("claims each recipient and sends separately with a stable idempotency key", async () => {
  expect((await deliverAdminEmails()).sent).toBe(1);
  expect(send).toHaveBeenCalledWith({
    to: "reader@example.test",
    subject: "Information",
    body: "Texte",
    idempotencyKey: "admin-message-delivery1",
  });
  expect(update).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ emailStatus: "SENT" }),
    }),
  );
});
it("does not send when another worker owns the claim", async () => {
  updateMany.mockResolvedValue({ count: 0 });
  await deliverAdminEmails();
  expect(send).not.toHaveBeenCalled();
});
it("does not claim success after provider failure", async () => {
  send.mockResolvedValue({ success: false });
  expect((await deliverAdminEmails()).failed).toBe(1);
  expect(update).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ emailStatus: "FAILED" }),
    }),
  );
});
it("skips unverified recipients", async () => {
  findUnique.mockResolvedValue({ user: { emailVerified: null }, message: {} });
  await deliverAdminEmails();
  expect(send).not.toHaveBeenCalled();
  expect(update).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ emailStatus: "SKIPPED" }),
    }),
  );
});
it("does not retry outside the provider's deduplication window", async () => {
  findMany.mockResolvedValue([
    { id: "old", emailFirstAttemptAt: new Date(Date.now() - 24 * 60 * 60_000) },
  ]);
  expect(await deliverAdminEmails()).toMatchObject({ failed: 1, processed: 1 });
  expect(send).not.toHaveBeenCalled();
  expect(updateMany).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        emailAttempts: 3,
        emailStatus: "FAILED",
      }),
    }),
  );
});

it("scopes immediate delivery to the current reservation's messages", async () => {
  await deliverAdminEmails(["reservation-message"]);
  expect(findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        messageId: { in: ["reservation-message"] },
      }),
    }),
  );
});
it.each([
  { expiresAt: new Date(0) },
  {
    expectedReservationStatus: "CONFIRMED",
    reservation: { status: "CANCELLED" },
  },
])("skips stale reminders before contacting the provider", async (message) => {
  findUnique.mockResolvedValue({
    user: { emailVerified: new Date(), suspendedAt: null },
    message,
  });
  await deliverAdminEmails();
  expect(send).not.toHaveBeenCalled();
  expect(update).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ emailStatus: "SKIPPED" }),
    }),
  );
});
