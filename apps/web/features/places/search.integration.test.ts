import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { kinshasaDay, toKinshasaDate } from "@/features/reservations/domain";
import { restaurantSearchSchema, type SearchInput } from "./search-params";
import { searchRestaurants } from "./search-service";

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
describe.skipIf(!url)("restaurant search on PostgreSQL", () => {
  const db = new PrismaClient({
    datasources: {
      db: { url: url || "postgresql://unused:unused@localhost:1/unused" },
    },
  });
  const marker = `search-${randomUUID()}`,
    placeIds: string[] = [],
    userIds: string[] = [];
  const date = kinshasaDay(new Date(Date.now() + 7 * 86400000));
  let ownerId: string,
    reviewerId: string,
    categoryId: string,
    categorySlug: string;
  const search = (input: SearchInput = {}) =>
    searchRestaurants(
      db,
      restaurantSearchSchema.parse({ search: marker, ...input }),
    );
  beforeAll(async () => {
    const owner = await db.user.create({
      data: {
        name: "Search fixture owner",
        email: `${marker}-owner@example.test`,
        role: "OWNER",
      },
    });
    ownerId = owner.id;
    userIds.push(ownerId);
    const reviewer = await db.user.create({
      data: {
        name: "Search fixture customer",
        email: `${marker}-customer@example.test`,
      },
    });
    reviewerId = reviewer.id;
    userIds.push(reviewerId);
    const category = await db.category.create({
      data: { name: marker, slug: marker },
    });
    categoryId = category.id;
    categorySlug = category.slug;
    for (let index = 0; index < 16; index++) {
      const best = index === 14;
      const p = await db.place.create({
        data: {
          name: `${marker} ${String(index).padStart(2, "0")}`,
          slug: `${marker}-${index}`,
          description: "Restaurant de test",
          address: `Avenue ${marker}`,
          neighborhood: `${marker}-quartier`,
          latitude: best ? -4.31 : -4.6,
          longitude: best ? 15.28 : 15.5,
          ownerId,
          priceRange: best ? 1 : 3,
          status: index === 15 ? "PENDING" : "APPROVED",
          createdAt: new Date(Date.now() - index * 86400000),
          reservationCapacity: best ? 10 : 2,
          maxPartySize: 12,
          amenities: best ? ["TERRACE", "PARKING"] : [],
          categories: { create: { categoryId } },
        },
      });
      placeIds.push(p.id);
      await db.review.create({
        data: {
          placeId: p.id,
          authorId: reviewerId,
          rating: best ? 5 : 2,
          comment: "Fixture",
        },
      });
      if (!best)
        await db.reservation.create({
          data: {
            reference: `${marker}-${index}`,
            placeId: p.id,
            customerId: reviewerId,
            dateTime: toKinshasaDate(date, "19:00"),
            partySize: 2,
            status: index % 2 ? "PENDING" : "CONFIRMED",
          },
        });
    }
    await db.event.create({
      data: {
        title: marker,
        description: "Fixture",
        startDate: new Date(Date.now() + 86400000),
        status: "APPROVED",
        organizerId: ownerId,
        placeId: placeIds[14],
      },
    });
  }, 30000);
  afterAll(async () => {
    await db.place.deleteMany({ where: { id: { in: placeIds } } });
    if (categoryId) await db.category.delete({ where: { id: categoryId } });
    await db.user.deleteMany({ where: { id: { in: userIds } } });
    await db.$disconnect();
  });
  it("paginates every approved match and searches without case sensitivity", async () => {
    const first = await search({ search: marker.toUpperCase() });
    expect(first.total).toBe(15);
    expect(first.places).toHaveLength(12);
    expect(first.totalPages).toBe(2);
    const second = await search({ page: "2" });
    expect(second.places.map((p) => p.id)).toEqual(placeIds.slice(12, 15));
    expect(
      second.places.every((p) => !first.places.some((a) => a.id === p.id)),
    ).toBe(true);
  });
  it("sorts by budget and review average before selecting the first page", async () => {
    expect((await search({ sort: "price" })).places[0].id).toBe(placeIds[14]);
    expect((await search({ sort: "rating" })).places[0].id).toBe(placeIds[14]);
    const rated = await search({ minRating: "4" });
    expect(rated.total).toBe(1);
    expect(rated.places[0].id).toBe(placeIds[14]);
  });
  it("finds nearby restaurants even when they were outside the original first page", async () => {
    const result = await search({
      lat: "-4.31",
      lng: "15.28",
      radius: "2",
      sort: "distance",
    });
    expect(result.total).toBe(1);
    expect(result.places[0]).toMatchObject({ id: placeIds[14], distanceKm: 0 });
  });
  it("combines neighborhood, category, budgets, amenities and future approved events", async () => {
    const result = await search({
      neighborhood: `${marker}-QUARTIER`,
      category: categorySlug,
      priceRange: "1,2",
      amenities: "TERRACE,PARKING",
      eventsOnly: "true",
    });
    expect(result.places.map((p) => p.id)).toEqual([placeIds[14]]);
    expect((await search({ location: `Avenue ${marker}` })).total).toBe(15);
    expect((await search({ location: "KINSHASA" })).total).toBe(15);
  });
  it("checks schedules and both pending and confirmed seats before pagination", async () => {
    const result = await search({ date, time: "19:00", partySize: "2" });
    expect(result.places.map((p) => p.id)).toEqual([placeIds[14]]);
    expect((await search({ date, time: "03:00", partySize: "2" })).total).toBe(
      0,
    );
    expect((await search({ date, time: "19:00", partySize: "13" })).total).toBe(
      0,
    );
    await db.reservation.update({
      where: { reference: `${marker}-0` },
      data: { status: "CANCELLED" },
    });
    expect((await search({ date, time: "19:00", partySize: "2" })).total).toBe(
      2,
    );
  });
  it("searches public menus without exposing hidden menu items", async () => {
    await db.menuItem.create({
      data: { placeId: placeIds[14], name: `plat-${marker}`, available: true },
    });
    await db.place.update({
      where: { id: placeIds[14] },
      data: { menuVisible: true },
    });
    await db.menuItem.create({
      data: { placeId: placeIds[1], name: `secret-${marker}`, available: true },
    });
    expect(
      (await search({ search: `PLAT-${marker}` })).places.map((p) => p.id),
    ).toEqual([placeIds[14]]);
    expect((await search({ search: `secret-${marker}` })).total).toBe(0);
  });
  it("rejects expired booking searches instead of displaying fictional availability", async () => {
    await expect(search({ date: "2020-01-01", time: "19:00" })).rejects.toThrow(
      "Choisissez un créneau",
    );
  });
});
