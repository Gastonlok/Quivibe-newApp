import { Prisma, type PrismaClient } from "@prisma/client";
import {
  ACTIVE_STATUSES,
  getScheduleSlots,
  toKinshasaDate,
  MAX_RESERVATION_DURATION,
  MAX_BOOKING_DAYS,
  peakOccupiedSeats,
  reservationDayKey,
} from "@/features/reservations/domain";
import { distanceKm, type RestaurantSearch } from "./search-params";

export function searchWhere(
  filters: RestaurantSearch,
  now: Date,
): Prisma.PlaceWhereInput {
  const and: Prisma.PlaceWhereInput[] = [];
  if (filters.search) {
    const match = {
      contains: filters.search,
      mode: Prisma.QueryMode.insensitive,
    };
    and.push({
      OR: [
        { name: match },
        { description: match },
        {
          categories: {
            some: { category: { OR: [{ name: match }, { slug: match }] } },
          },
        },
        {
          menuVisible: true,
          menuItems: {
            some: {
              available: true,
              OR: [{ name: match }, { description: match }],
            },
          },
        },
      ],
    });
  }
  // All current listings belong to Kinshasa; the city also works as free text.
  if (
    filters.location &&
    filters.location.toLocaleLowerCase("fr") !== "kinshasa"
  ) {
    const match = {
      contains: filters.location,
      mode: Prisma.QueryMode.insensitive,
    };
    and.push({ OR: [{ neighborhood: match }, { address: match }] });
  }
  return {
    status: "APPROVED",
    AND: and,
    ...(filters.neighborhood
      ? { neighborhood: { equals: filters.neighborhood, mode: "insensitive" } }
      : {}),
    ...(filters.category
      ? { categories: { some: { category: { slug: filters.category } } } }
      : {}),
    ...(filters.priceRange.length
      ? { priceRange: { in: filters.priceRange } }
      : {}),
    ...(filters.reservationsOnly || filters.date
      ? { reservationsEnabled: true }
      : {}),
    ...(filters.date ? { maxPartySize: { gte: filters.partySize } } : {}),
    ...(filters.date
      ? {
          reservationDays: {
            none: {
              date: reservationDayKey(filters.date),
              OR: [{ closed: true }, { closedTimes: { has: filters.time } }],
            },
          },
        }
      : {}),
    ...(filters.eventsOnly
      ? { events: { some: { status: "APPROVED", startDate: { gte: now } } } }
      : {}),
    ...(filters.amenities.length
      ? { amenities: { hasEvery: filters.amenities } }
      : {}),
  };
}

export async function searchRestaurants(
  db: PrismaClient,
  filters: RestaurantSearch,
  userId?: string,
  now = new Date(),
) {
  const when = filters.date ? toKinshasaDate(filters.date, filters.time) : null;
  if (
    when &&
    (when.getTime() < now.getTime() + 60 * 60_000 ||
      when.getTime() > now.getTime() + MAX_BOOKING_DAYS * 86400000)
  )
    throw new Error(
      "Choisissez un créneau entre une heure et un an à partir de maintenant.",
    );
  const where = searchWhere(filters, now);
  // Sort/filter the complete candidate set before pagination. Only IDs and
  // matching fields are loaded here; photos and other details are page-limited.
  const [candidates, ratings] = await Promise.all([
    db.place.findMany({
      where,
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        priceRange: true,
        createdAt: true,
        reservationCapacity: true,
        reservationDuration: true,
        reservationStartTime: true,
        reservationEndTime: true,
        reservationInterval: true,
      },
    }),
    db.review.groupBy({
      by: ["placeId"],
      where: { status: "APPROVED", place: where },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);
  const scores = new Map(
    ratings.map((r) => [
      r.placeId,
      { average: r._avg.rating || 0, count: r._count.rating },
    ]),
  );
  const maxDuration = Math.max(
    0,
    ...candidates.map((p) => p.reservationDuration),
  );
  const booked =
    when && candidates.length
      ? await db.reservation.findMany({
          where: {
            placeId: { in: candidates.map((p) => p.id) },
            status: { in: ACTIVE_STATUSES },
            dateTime: {
              gt: new Date(when.getTime() - MAX_RESERVATION_DURATION * 60_000),
              lt: new Date(when.getTime() + maxDuration * 60_000),
            },
          },
          select: {
            placeId: true,
            dateTime: true,
            partySize: true,
            durationMinutes: true,
          },
        })
      : [];
  const seats = new Map<string, typeof booked>();
  for (const booking of booked) {
    const placeSeats = seats.get(booking.placeId) || [];
    placeSeats.push(booking);
    seats.set(booking.placeId, placeSeats);
  }
  const matches = candidates
    .map((p) => ({
      ...p,
      rating: scores.get(p.id)?.average || 0,
      reviewCount: scores.get(p.id)?.count || 0,
      distance:
        filters.lat !== undefined && filters.lng !== undefined
          ? distanceKm(filters.lat, filters.lng, p.latitude, p.longitude)
          : null,
    }))
    .filter((p) => {
      if (
        p.rating < filters.minRating ||
        (p.distance !== null && p.distance > filters.radius)
      )
        return false;
      if (!when) return true;
      if (!getScheduleSlots(p).includes(filters.time)) return false;
      const occupied = peakOccupiedSeats(
        seats.get(p.id) || [],
        when,
        p.reservationDuration,
      );
      return occupied + filters.partySize <= p.reservationCapacity;
    });
  matches.sort((a, b) => {
    if (filters.sort === "rating")
      return (
        b.rating - a.rating ||
        b.reviewCount - a.reviewCount ||
        a.id.localeCompare(b.id)
      );
    if (filters.sort === "price")
      return (
        a.priceRange - b.priceRange ||
        b.rating - a.rating ||
        a.id.localeCompare(b.id)
      );
    if (filters.sort === "distance")
      return (
        (a.distance ?? Infinity) - (b.distance ?? Infinity) ||
        a.id.localeCompare(b.id)
      );
    if (filters.sort === "relevance" && filters.search) {
      const term = filters.search.toLocaleLowerCase("fr");
      const score = (name: string) =>
        name.toLocaleLowerCase("fr") === term
          ? 2
          : name.toLocaleLowerCase("fr").includes(term)
            ? 1
            : 0;
      const difference = score(b.name) - score(a.name);
      if (difference) return difference;
    }
    return (
      b.createdAt.getTime() - a.createdAt.getTime() || a.id.localeCompare(b.id)
    );
  });
  const totalPages = Math.ceil(matches.length / 12),
    page = Math.min(filters.page, totalPages || 1);
  const selected = matches.slice((page - 1) * 12, page * 12);
  const details = await db.place.findMany({
    where: { id: { in: selected.map((p) => p.id) }, status: "APPROVED" },
    select: {
      id: true,
      name: true,
      slug: true,
      neighborhood: true,
      priceRange: true,
      reservationsEnabled: true,
      media: {
        take: 2,
        orderBy: { createdAt: "asc" },
        select: { url: true, altText: true },
      },
      categories: { select: { category: { select: { name: true } } } },
      favorites: {
        where: { userId: userId || "" },
        select: { userId: true },
        take: 1,
      },
      events: {
        where: { status: "APPROVED", startDate: { gte: now } },
        select: { id: true },
        take: 1,
      },
    },
  });
  const byId = new Map(details.map((p) => [p.id, p]));
  const places = selected.flatMap((candidate) => {
    const place = byId.get(candidate.id);
    if (!place) return [];
    const { favorites, ...data } = place;
    return [
      {
        ...data,
        averageRating: candidate.reviewCount ? candidate.rating : null,
        reviewCount: candidate.reviewCount,
        isFavorite: favorites.length > 0,
        distanceKm: candidate.distance,
      },
    ];
  });
  return { places, total: matches.length, page, totalPages };
}
