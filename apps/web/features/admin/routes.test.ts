import { beforeEach, describe, expect, it, vi } from "vitest";
const { actor, db } = vi.hoisted(() => ({
  actor: vi.fn(),
  db: {
    user: {
      findUnique: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
    adminAuditLog: { create: vi.fn() },
    adminMessage: { findUnique: vi.fn(), create: vi.fn() },
    messageRecipient: { createMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/features/admin/access", () => ({ getAdminActor: actor }));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/features/admin/messages", () => ({
  recipientFilter: (audience: string, ids: string[]) => ({
    suspendedAt: null,
    ...(audience === "SELECTED" ? { id: { in: ids } } : {}),
  }),
}));
import {
  PATCH as updateUser,
  DELETE as deleteUser,
} from "../../app/api/admin/users/[userId]/route";
import { POST as createMessage } from "../../app/api/admin/messages/route";
const req = (body: unknown) =>
  new Request("http://localhost/api/admin", {
    method: "POST",
    body: JSON.stringify(body),
  });
const target = (userId = "target") => ({ params: Promise.resolve({ userId }) });
const message = {
  requestKey: "2fa9a529-715a-438b-95dc-363ff5d30f82",
  subject: "Information",
  body: "Message aux utilisateurs",
  audience: "SELECTED",
  userIds: ["u1", "u2"],
  sendEmail: true,
};
beforeEach(() => {
  vi.clearAllMocks();
  actor.mockResolvedValue({ id: "admin", role: "ADMIN" });
  db.$transaction.mockImplementation((callback) => callback(db));
  db.user.findUnique.mockResolvedValue({
    role: "USER",
    suspendedAt: null,
    _count: { places: 0, events: 0 },
  });
  db.user.count.mockResolvedValue(2);
  db.user.update.mockResolvedValue({ id: "target" });
  db.user.findMany.mockResolvedValue([
    { id: "u1", emailVerified: new Date() },
    { id: "u2", emailVerified: null },
  ]);
  db.adminMessage.findUnique.mockResolvedValue(null);
  db.adminMessage.create.mockResolvedValue({ id: "message1" });
  db.messageRecipient.createMany.mockResolvedValue({ count: 2 });
  db.adminAuditLog.create.mockResolvedValue({});
});
describe("account control endpoints", () => {
  it("rejects unauthorized calls before mutation", async () => {
    actor.mockResolvedValue(null);
    expect((await updateUser(req({ role: "ADMIN" }), target())).status).toBe(
      403,
    );
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it("prevents self deletion, suspension and demotion", async () => {
    expect(
      (await updateUser(req({ suspended: true }), target("admin"))).status,
    ).toBe(409);
    expect(
      (await updateUser(req({ role: "USER" }), target("admin"))).status,
    ).toBe(409);
    expect((await deleteUser(req({}), target("admin"))).status).toBe(409);
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it("protects the last active admin with serializable isolation", async () => {
    db.user.findUnique.mockResolvedValue({ role: "ADMIN", suspendedAt: null });
    db.user.count.mockResolvedValue(1);
    expect((await updateUser(req({ role: "USER" }), target())).status).toBe(
      409,
    );
    expect(db.user.update).not.toHaveBeenCalled();
    expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "Serializable",
    });
  });
  it("saves permissions and their audit record in one transaction", async () => {
    expect(
      (await updateUser(req({ moderationPermissions: ["REVIEWS"] }), target()))
        .status,
    ).toBe(200);
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { moderationPermissions: ["REVIEWS"] } }),
    );
    expect(db.adminAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorId: "admin",
          action: "USER_UPDATED",
          targetId: "target",
        }),
      }),
    );
  });
  it("requires reassignment before deleting an owner", async () => {
    db.user.findUnique.mockResolvedValue({
      role: "OWNER",
      suspendedAt: null,
      _count: { places: 1, events: 0 },
    });
    expect((await deleteUser(req({}), target())).status).toBe(409);
    expect(db.user.delete).not.toHaveBeenCalled();
  });
});
describe("personal and group messages", () => {
  it("does not let a moderator send messages", async () => {
    actor.mockResolvedValue(null);
    expect((await createMessage(req(message))).status).toBe(403);
    expect(actor).toHaveBeenCalledWith("MESSAGES");
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it("previews the audience without creating or sending a message", async () => {
    db.user.findMany.mockResolvedValue([
      { id: "u1", name: "Destinataire", email: "recipient@example.com" },
    ]);
    const response = await createMessage(req({ ...message, preview: true }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      recipients: [
        { id: "u1", name: "Destinataire", email: "recipient@example.com" },
      ],
    });
    expect(db.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { suspendedAt: null, id: { in: message.userIds } },
        select: { id: true, name: true, email: true },
      }),
    );
    expect(db.user.count).toHaveBeenCalledTimes(2);
    expect(db.adminMessage.create).not.toHaveBeenCalled();
  });
  it("creates individual inbox entries and queues verified recipients only", async () => {
    expect((await createMessage(req(message))).status).toBe(201);
    expect(db.messageRecipient.createMany).toHaveBeenCalledWith({
      data: [
        { messageId: "message1", userId: "u1", emailStatus: "PENDING" },
        { messageId: "message1", userId: "u2", emailStatus: "SKIPPED" },
      ],
    });
  });
  it("deduplicates a repeated request and rejects changed content under the same key", async () => {
    await createMessage(req(message));
    const saved = db.adminMessage.create.mock.calls[0][0].data;
    db.adminMessage.findUnique.mockResolvedValue({ id: "message1", ...saved });
    expect((await createMessage(req(message))).status).toBe(201);
    expect(db.adminMessage.create).toHaveBeenCalledTimes(1);
    expect(
      (await createMessage(req({ ...message, body: "Contenu différent" })))
        .status,
    ).toBe(409);
  });
});
