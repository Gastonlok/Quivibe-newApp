import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { createReservation, changeReservationStatus } from "./service";
import { kinshasaDay } from "./domain";
import { queueNotification } from "./notifications";

const databaseUrl = process.env.RESERVATION_TEST_DATABASE_URL;
// Opt-in only. The developer runner creates and removes a fresh schema.
if (databaseUrl) {
  const url = new URL(databaseUrl);
  if (
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    (!/^pilot_test_[a-f0-9]{32}$/.test(url.searchParams.get("schema") || "") &&
      url.pathname !== "/quivibe_ci")
  )
    throw new Error("An isolated local test database is required.");
}

describe.skipIf(!databaseUrl)("reservation PostgreSQL transactions", () => {
  const db = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl || "postgresql://unused:unused@localhost:1/unused",
      },
    },
  });
  const userIds: string[] = [],
    placeIds: string[] = [];
  let owner: { id: string; role: string },
    customer: { id: string; role: string },
    stranger: { id: string; role: string };
  const date = kinshasaDay(new Date(Date.now() + 7 * 24 * 60 * 60_000));
  const request = (placeId: string) => ({
    requestKey: randomUUID(),
    placeId,
    date,
    time: "19:00",
    partySize: 2,
  });
  async function place(extra: Record<string, unknown> = {}) {
    const result = await db.place.create({
      data: {
        name: "Pilot integration fixture",
        slug: `pilot-test-${randomUUID()}`,
        description: "Fixture",
        address: "Test",
        neighborhood: "Test",
        latitude: 0,
        longitude: 0,
        priceRange: 1,
        ownerId: owner.id,
        status: "APPROVED",
        ...extra,
      },
    });
    placeIds.push(result.id);
    return result;
  }
  async function saved(reference: string) {
    return db.reservation.findUniqueOrThrow({
      where: { reference },
      include: {
        history: true,
        notifications: { include: { recipients: true } },
      },
    });
  }
  beforeAll(async () => {
    const makeUser = async (role: string) => {
      const u = await db.user.create({
        data: {
          name: `Fixture ${role}`,
          email: `${randomUUID()}@example.test`,
          role,
          emailVerified: new Date(),
        },
      });
      userIds.push(u.id);
      return u;
    };
    owner = await makeUser("OWNER");
    customer = await makeUser("USER");
    stranger = await makeUser("USER");
    // Open both connections before testing overlapping transactions, including
    // on local Docker installations whose cold connections can take seconds.
    await Promise.all([db.$queryRaw`SELECT 1`, db.$queryRaw`SELECT 1`]);
  });
  afterAll(async () => {
    await db.place.deleteMany({ where: { id: { in: placeIds } } });
    // Waitlist notifications are not linked to reservations; remove only fixture audiences.
    await db.adminMessage.deleteMany({
      where: {
        kind: "RESERVATION",
        recipients: { some: { userId: { in: userIds } } },
      },
    });
    await db.user.deleteMany({ where: { id: { in: userIds } } });
    await db.$disconnect();
  });

  it("atomically records the booking, owner snapshot, history and both notifications", async () => {
    const p = await place({ autoConfirmReservations: false });
    const input = request(p.id);
    const result = await createReservation(
      db,
      customer.id,
      customer.role,
      input,
    );
    const r = await saved(result.reference);
    expect(r).toMatchObject({
      status: "PENDING",
      ownerIdAtBooking: owner.id,
      source: "QUIVIBE",
      channel: "UNKNOWN",
      totalAmount: null,
      currency: null,
      paymentStatus: "NOT_TRACKED",
    });
    expect(r.commissionAmount.toString()).toBe("0");
    expect(r.commissionRate.toString()).toBe("0");
    expect(r.history).toHaveLength(1);
    expect(r.history[0]).toMatchObject({
      actorId: customer.id,
      actorRole: "CUSTOMER",
      fromStatus: null,
      toStatus: "PENDING",
    });
    expect(r.notifications).toHaveLength(2);
    expect(
      r.notifications
        .flatMap((n) => n.recipients)
        .map((r) => r.userId)
        .sort(),
    ).toEqual([owner.id, customer.id].sort());
    expect(
      r.notifications.find((n) => n.recipients[0].userId === customer.id)?.body,
    ).toContain("Attendez la confirmation");
    expect(p.commercialStatus).toBe("PILOT");
    await db.place.update({
      where: { id: p.id },
      data: { ownerId: stranger.id },
    });
    expect((await saved(result.reference)).ownerIdAtBooking).toBe(owner.id);
  });

  it("deduplicates simultaneous retries and rejects a reused key with another payload", async () => {
    const p = await place(),
      input = request(p.id);
    const results = await Promise.all([
      createReservation(db, customer.id, customer.role, input),
      createReservation(db, customer.id, customer.role, input),
    ]);
    expect(results[0].reference).toBe(results[1].reference);
    expect(await db.reservation.count({ where: { placeId: p.id } })).toBe(1);
    expect((await saved(results[0].reference)).history).toHaveLength(1);
    await expect(
      createReservation(db, customer.id, customer.role, {
        ...input,
        partySize: 3,
      }),
    ).rejects.toMatchObject({ code: "KEY_CONFLICT" });
    await expect(
      createReservation(db, stranger.id, stranger.role, input),
    ).rejects.toMatchObject({ code: "KEY_CONFLICT" });
  });

  it("lets only one concurrent party book the final capacity", async () => {
    const p = await place({ reservationCapacity: 2 });
    const results = await Promise.allSettled([
      createReservation(db, customer.id, customer.role, request(p.id)),
      createReservation(db, stranger.id, stranger.role, request(p.id)),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.find((r) => r.status === "rejected")).toMatchObject({
      reason: { code: "NO_CAPACITY" },
    });
    expect(await db.reservation.count({ where: { placeId: p.id } })).toBe(1);
  });

  it("attributes only a recent visit to the same restaurant and excludes staff", async () => {
    const p = await place(),
      visitorKey = randomUUID();
    const v = await db.placeVisit.create({
      data: { placeId: p.id, visitorKey, channel: "AI" },
    });
    const a = await createReservation(
      db,
      customer.id,
      customer.role,
      request(p.id),
      visitorKey,
    );
    expect(await saved(a.reference)).toMatchObject({
      attributedVisitId: v.id,
      channel: "AI",
    });
    const b = await createReservation(
      db,
      owner.id,
      owner.role,
      request(p.id),
      visitorKey,
    );
    expect((await saved(b.reference)).attributedVisitId).toBeNull();
    const other = await place();
    const c = await createReservation(
      db,
      customer.id,
      customer.role,
      request(other.id),
      visitorKey,
    );
    expect((await saved(c.reference)).attributedVisitId).toBeNull();
    await db.placeVisit.update({
      where: { id: v.id },
      data: { visitedAt: new Date(Date.now() - 31 * 60_000) },
    });
    const d = await createReservation(
      db,
      customer.id,
      customer.role,
      request(p.id),
      visitorKey,
    );
    expect((await saved(d.reference)).attributedVisitId).toBeNull();
  });

  it("enforces ownership and collaborator access inside the transaction", async () => {
    const p = await place({ autoConfirmReservations: false });
    const r = await saved(
      (await createReservation(db, customer.id, customer.role, request(p.id)))
        .reference,
    );
    await expect(
      changeReservationStatus(db, stranger, r.id, "CONFIRMED", false),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      changeReservationStatus(db, stranger, r.id, "CANCELLED", true),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await db.placeCollaborator.create({
      data: { placeId: p.id, userId: stranger.id, role: "EDITOR" },
    });
    await changeReservationStatus(db, stranger, r.id, "CONFIRMED", false);
    expect((await saved(r.reference)).history).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actorId: stranger.id,
          actorRole: "EDITOR",
          toStatus: "CONFIRMED",
        }),
      ]),
    );
    await db.placeCollaborator.deleteMany({
      where: { placeId: p.id, userId: stranger.id },
    });
    await expect(
      changeReservationStatus(db, stranger, r.id, "CANCELLED", false),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("prevents future outcomes, records exact optional spending and keeps commissions zero", async () => {
    const p = await place();
    const r = await saved(
      (await createReservation(db, customer.id, customer.role, request(p.id)))
        .reference,
    );
    await expect(
      changeReservationStatus(db, owner, r.id, "COMPLETED", false),
    ).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
    await db.reservation.update({
      where: { id: r.id },
      data: { dateTime: new Date(Date.now() - 60_000) },
    });
    await changeReservationStatus(db, owner, r.id, "COMPLETED", false, {
      totalAmount: "9999999999.99",
      currency: "CDF",
    });
    await changeReservationStatus(db, owner, r.id, "COMPLETED", false, {
      totalAmount: "9999999999.99",
      currency: "CDF",
    });
    const updated = await saved(r.reference);
    expect(updated.totalAmount?.toFixed(2)).toBe("9999999999.99");
    expect(updated.commissionAmount.toString()).toBe("0");
    expect(updated.history).toHaveLength(2);
    await expect(
      changeReservationStatus(db, owner, r.id, "COMPLETED", false, {
        totalAmount: "1",
        currency: "CDF",
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("commits only one of two conflicting outcomes", async () => {
    const p = await place(),
      r = await saved(
        (await createReservation(db, customer.id, customer.role, request(p.id)))
          .reference,
      );
    await db.reservation.update({
      where: { id: r.id },
      data: { dateTime: new Date(Date.now() - 60_000) },
    });
    const results = await Promise.allSettled([
      changeReservationStatus(db, owner, r.id, "COMPLETED", false),
      changeReservationStatus(db, owner, r.id, "NO_SHOW", false),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((await saved(r.reference)).history).toHaveLength(2);
    expect((await saved(r.reference)).notifications).toHaveLength(4);
  });

  it("cancellation queues waitlist alerts once and records who cancelled", async () => {
    const p = await place(),
      input = request(p.id);
    await db.reservationWaitlist.create({
      data: {
        placeId: p.id,
        customerId: stranger.id,
        date: new Date(`${date}T00:00:00+01:00`),
        partySize: 2,
      },
    });
    const r = await saved(
      (await createReservation(db, customer.id, customer.role, input))
        .reference,
    );
    await changeReservationStatus(db, customer, r.id, "CANCELLED", true);
    await changeReservationStatus(db, customer, r.id, "CANCELLED", true);
    expect((await saved(r.reference)).history).toHaveLength(2);
    expect(
      await db.adminMessage.count({
        where: {
          requestKey: { startsWith: "waitlist:" },
          recipients: { some: { userId: stranger.id } },
        },
      }),
    ).toBe(1);
  });

  it("does not enqueue duplicate reminders and skips email for unverified accounts", async () => {
    const p = await place(),
      r = await saved(
        (await createReservation(db, customer.id, customer.role, request(p.id)))
          .reference,
      );
    const input = {
      key: `reservation-reminder:${r.id}`,
      subject: "Reminder fixture",
      body: "Fixture",
      user: { id: customer.id, emailVerified: null, suspendedAt: null },
      reservationId: r.id,
      expectedReservationStatus: "CONFIRMED",
    };
    const first = await db.$transaction((tx) => queueNotification(tx, input));
    const second = await db.$transaction((tx) => queueNotification(tx, input));
    expect(first).toBe(second);
    expect(
      (
        await db.messageRecipient.findFirstOrThrow({
          where: { messageId: first! },
        })
      ).emailStatus,
    ).toBe("SKIPPED");
  });
});
