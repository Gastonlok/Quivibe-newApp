import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import {
  confirmSubscription,
  queueCampaign,
  saveCampaign,
  subscribe,
  unsubscribe,
} from "./service";
import { newsletterToken, newsletterRateKey } from "./tokens";
import { deliverNewsletter } from "./delivery";

const url = process.env.RESERVATION_TEST_DATABASE_URL;
if (url) {
  const target = new URL(url);
  if (
    !["localhost", "127.0.0.1", "[::1]"].includes(target.hostname) ||
    (!/^pilot_test_[a-f0-9]{32}$/.test(
      target.searchParams.get("schema") || "",
    ) &&
      target.pathname !== "/quivibe_ci")
  )
    throw new Error("An isolated local test database is required.");
}
describe.skipIf(!url)("newsletter lifecycle on PostgreSQL", () => {
  const db = new PrismaClient({
    datasources: {
      db: { url: url || "postgresql://unused:unused@localhost:1/unused" },
    },
  });
  const marker = `newsletter-${randomUUID()}`,
    rateKeys: string[] = [],
    campaignIds: string[] = [];
  let adminId: string,
    n = 0;
  beforeAll(async () => {
    adminId = (
      await db.user.create({
        data: {
          name: "Newsletter fixture",
          email: `${marker}@example.test`,
          role: "ADMIN",
        },
      })
    ).id;
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
  afterAll(async () => {
    await db.newsletterCampaign.deleteMany({
      where: { id: { in: campaignIds } },
    });
    await db.newsletterSubscriber.deleteMany({
      where: { email: { startsWith: marker } },
    });
    await db.newsletterRateLimit.deleteMany({
      where: { key: { in: rateKeys } },
    });
    if (adminId) {
      await db.adminAuditLog.deleteMany({ where: { actorId: adminId } });
      await db.user.delete({ where: { id: adminId } });
    }
    await db.$disconnect();
  });
  async function pending() {
    const email = `${marker}-${++n}@example.test`,
      ip = `${marker}-${n}`,
      now = new Date();
    rateKeys.push(newsletterRateKey(ip, now));
    await subscribe(db, email, ip, now);
    return db.newsletterSubscriber.findUniqueOrThrow({ where: { email } });
  }
  async function campaign() {
    const id = randomUUID();
    campaignIds.push(id);
    return saveCampaign(
      db,
      {
        id,
        revision: 0,
        subject: "Les bonnes tables",
        body: "Découvrez nos nouvelles adresses à Kinshasa.",
      },
      adminId,
    );
  }
  function mockEmail() {
    vi.stubEnv("RESEND_API_KEY", "mock-only");
    const fetch = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({ id: "mock-provider" }),
      });
    vi.stubGlobal("fetch", fetch);
    return fetch;
  }
  it("deduplicates concurrent subscriptions and leaves them unconfirmed", async () => {
    const email = `${marker}-concurrent@example.test`,
      ip = `${marker}-concurrent`,
      now = new Date();
    rateKeys.push(newsletterRateKey(ip, now));
    await Promise.all([
      subscribe(db, email, ip, now),
      subscribe(db, email, ip, now),
    ]);
    const s = await db.newsletterSubscriber.findUniqueOrThrow({
      where: { email },
      include: { deliveries: true },
    });
    expect(s.status).toBe("PENDING");
    expect(s.deliveries).toHaveLength(1);
  });
  it("rejects expired and wrong-purpose confirmation links", async () => {
    const s = await pending();
    await expect(
      confirmSubscription(
        db,
        newsletterToken(s.id, s.tokenVersion, "unsubscribe"),
      ),
    ).rejects.toThrow("invalide");
    await expect(
      confirmSubscription(
        db,
        newsletterToken(s.id, s.tokenVersion, "confirm"),
        new Date(s.requestedAt.getTime() + 73 * 3600000),
      ),
    ).rejects.toThrow("expiré");
    expect(
      (await db.newsletterSubscriber.findUniqueOrThrow({ where: { id: s.id } }))
        .status,
    ).toBe("PENDING");
  });
  it("confirms idempotently and queues a campaign only once for confirmed subscribers", async () => {
    const s = await pending(),
      unconfirmed = await pending(),
      token = newsletterToken(s.id, s.tokenVersion, "confirm");
    await confirmSubscription(db, token);
    await confirmSubscription(db, token);
    const c = await campaign();
    await Promise.all([
      queueCampaign(db, c.id, c.revision, adminId),
      queueCampaign(db, c.id, c.revision, adminId),
    ]);
    expect(
      await db.newsletterDelivery.count({
        where: { campaignId: c.id, subscriberId: s.id },
      }),
    ).toBe(1);
    expect(
      await db.newsletterDelivery.count({
        where: { campaignId: c.id, subscriberId: unconfirmed.id },
      }),
    ).toBe(0);
    await expect(
      saveCampaign(db, { ...c, revision: 1, subject: "Changed" }, adminId),
    ).rejects.toThrow("modifiée");
  });
  it("rejects stale previews and stale draft edits", async () => {
    const c = await campaign();
    await saveCampaign(db, { ...c, subject: "Sujet modifié" }, adminId);
    await expect(queueCampaign(db, c.id, c.revision, adminId)).rejects.toThrow(
      "aperçu",
    );
    await expect(
      saveCampaign(db, { ...c, subject: "Autre modification" }, adminId),
    ).rejects.toThrow("ailleurs");
  });
  it("cancels pending emails on opt-out and invalidates old links on a new subscription", async () => {
    const s = await pending(),
      confirmation = newsletterToken(s.id, s.tokenVersion, "confirm"),
      optout = newsletterToken(s.id, s.tokenVersion, "unsubscribe");
    await confirmSubscription(db, confirmation);
    const c = await campaign();
    await queueCampaign(db, c.id, c.revision, adminId);
    await unsubscribe(db, optout);
    await unsubscribe(db, optout);
    expect(
      await db.newsletterDelivery.count({
        where: { subscriberId: s.id, status: "PENDING" },
      }),
    ).toBe(0);
    const later = new Date(s.requestedAt.getTime() + 11 * 60000),
      ip = `${marker}-resub`;
    rateKeys.push(newsletterRateKey(ip, later));
    await subscribe(db, s.email, ip, later);
    await expect(confirmSubscription(db, confirmation)).rejects.toThrow(
      "invalide",
    );
    await expect(unsubscribe(db, optout)).rejects.toThrow("invalide");
    expect(
      (await db.newsletterSubscriber.findUniqueOrThrow({ where: { id: s.id } }))
        .status,
    ).toBe("PENDING");
  });
  it("bounds repeated subscription requests per address source", async () => {
    const ip = `${marker}-rate`,
      now = new Date();
    rateKeys.push(newsletterRateKey(ip, now));
    for (let i = 0; i < 8; i++)
      await subscribe(db, `${marker}-limited@example.test`, ip, now);
    await expect(
      subscribe(db, `${marker}-limited@example.test`, ip, now),
    ).rejects.toMatchObject({ status: 429 });
  });
  it("retains the queue when the email service is absent", async () => {
    const s = await pending(),
      delivery = await db.newsletterDelivery.findFirstOrThrow({
        where: { subscriberId: s.id },
      });
    vi.stubEnv("RESEND_API_KEY", "");
    expect(
      (await deliverNewsletter(db, { ids: [delivery.id] })).unavailable,
    ).toBe(true);
    expect(
      (
        await db.newsletterDelivery.findUniqueOrThrow({
          where: { id: delivery.id },
        })
      ).attempts,
    ).toBe(0);
  });
  it("claims a delivery once across concurrent workers and signs confirmation links", async () => {
    const s = await pending(),
      delivery = await db.newsletterDelivery.findFirstOrThrow({
        where: { subscriberId: s.id },
      });
    const fetch = mockEmail();
    await Promise.all([
      deliverNewsletter(db, { ids: [delivery.id] }),
      deliverNewsletter(db, { ids: [delivery.id] }),
    ]);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetch.mock.calls[0][1].body).html).toContain(
      "/newsletter/confirm?token=confirm.",
    );
    expect(
      (
        await db.newsletterDelivery.findUniqueOrThrow({
          where: { id: delivery.id },
        })
      ).status,
    ).toBe("SENT");
  });
  it("retries failures with the same provider key and stops outside its deduplication window", async () => {
    const s = await pending(),
      delivery = await db.newsletterDelivery.findFirstOrThrow({
        where: { subscriberId: s.id },
      });
    const fetch = mockEmail();
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({}),
    });
    await deliverNewsletter(db, { ids: [delivery.id] });
    await db.newsletterDelivery.update({
      where: { id: delivery.id },
      data: { attemptAt: new Date(Date.now() - 6 * 60000) },
    });
    await deliverNewsletter(db, { ids: [delivery.id] });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[0][1].headers["Idempotency-Key"]).toBe(
      fetch.mock.calls[1][1].headers["Idempotency-Key"],
    );
    await db.newsletterDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "FAILED",
        attempts: 1,
        attemptAt: new Date(Date.now() - 6 * 60000),
        firstAttemptAt: new Date(Date.now() - 24 * 3600000),
      },
    });
    await deliverNewsletter(db, { ids: [delivery.id] });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(
      (
        await db.newsletterDelivery.findUniqueOrThrow({
          where: { id: delivery.id },
        })
      ).attempts,
    ).toBe(3);
  });
  it("skips revoked consent versions before sending a campaign", async () => {
    const s = await pending();
    await confirmSubscription(
      db,
      newsletterToken(s.id, s.tokenVersion, "confirm"),
    );
    const c = await campaign();
    await queueCampaign(db, c.id, c.revision, adminId);
    const delivery = await db.newsletterDelivery.findFirstOrThrow({
      where: { subscriberId: s.id, campaignId: c.id },
    });
    await db.newsletterSubscriber.update({
      where: { id: s.id },
      data: { tokenVersion: randomUUID() },
    });
    const fetch = mockEmail();
    await deliverNewsletter(db, { ids: [delivery.id] });
    expect(fetch).not.toHaveBeenCalled();
    expect(
      (
        await db.newsletterDelivery.findUniqueOrThrow({
          where: { id: delivery.id },
        })
      ).status,
    ).toBe("SKIPPED");
  });
});
