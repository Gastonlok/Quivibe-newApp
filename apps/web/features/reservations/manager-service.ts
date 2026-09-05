import type { PrismaClient } from "@prisma/client";
import {
  ACTIVE_STATUSES,
  MAX_BOOKING_DAYS,
  getScheduleSlots,
  kinshasaDay,
  reservationDayKey,
  toKinshasaDate,
} from "./domain";
import { getDayAvailability } from "./availability";
import { ReservationError, serializable } from "./service";
import {
  reservationDayUpdateSchema,
  type ReservationDayUpdateInput,
} from "./schema";

type Actor = { id: string; role: string };

function managedPlaces(actor: Actor) {
  return actor.role === "ADMIN"
    ? {}
    : {
        OR: [
          { ownerId: actor.id },
          { collaborators: { some: { userId: actor.id } } },
        ],
      };
}

export async function updateReservationDay(
  db: PrismaClient,
  actor: Actor,
  raw: ReservationDayUpdateInput,
) {
  const parsed = reservationDayUpdateSchema.safeParse(raw);
  if (!parsed.success)
    throw new ReservationError(
      "INVALID_INPUT",
      "Paramètres de disponibilité invalides.",
    );
  const input = parsed.data;
  const now = new Date();
  if (
    input.date < kinshasaDay(now) ||
    input.date >
      kinshasaDay(new Date(now.getTime() + MAX_BOOKING_DAYS * 86400000))
  )
    throw new ReservationError(
      "INVALID_DATE",
      "Choisissez une date entre aujourd’hui et un an à partir de maintenant.",
    );
  if (input.time && toKinshasaDate(input.date, input.time) <= now)
    throw new ReservationError(
      "PAST_SLOT",
      "Un créneau passé ne peut plus être modifié.",
    );
  return serializable(db, async (tx) => {
    const place = await tx.place.findFirst({
      where: { id: input.placeId, ...managedPlaces(actor) },
    });
    if (!place)
      throw new ReservationError(
        "FORBIDDEN",
        "Vous ne pouvez pas gérer cet établissement.",
      );
    if (input.time && !getScheduleSlots(place).includes(input.time))
      throw new ReservationError(
        "INVALID_SLOT",
        "Ce créneau ne fait plus partie des horaires du restaurant.",
      );
    const where = {
      placeId_date: { placeId: place.id, date: reservationDayKey(input.date) },
    };
    const current = await tx.reservationDay.findUnique({ where });
    if (input.time && current?.closed)
      throw new ReservationError(
        "DAY_CLOSED",
        "Rouvrez la journée avant de modifier un créneau.",
      );
    const closedTimes = new Set(current?.closedTimes || []);
    if (input.time) {
      if (input.closed) closedTimes.add(input.time);
      else closedTimes.delete(input.time);
    } else if (!input.closed) closedTimes.clear();
    const data = {
      closed: input.time ? current?.closed || false : input.closed,
      closedTimes: [...closedTimes].sort(),
      updatedById: actor.id,
    };
    await tx.reservationDay.upsert({
      where,
      create: {
        placeId: place.id,
        date: reservationDayKey(input.date),
        ...data,
      },
      update: data,
    });
    // Existing reservations are retained. Closing only prevents new arrivals.
    return { slug: place.slug, placeId: place.id };
  });
}

export async function getReservationManager(
  db: PrismaClient,
  actor: Actor,
  input: { placeId?: string; date: string; all: boolean; page: number },
) {
  const places = await db.place.findMany({
    where: managedPlaces(actor),
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      reservationsEnabled: true,
      reservationStartTime: true,
      reservationEndTime: true,
      reservationDuration: true,
      reservationInterval: true,
      reservationCapacity: true,
    },
    orderBy: { name: "asc" },
  });
  const place = input.placeId
    ? places.find((p) => p.id === input.placeId)
    : places[0];
  if (!place) return { places, place: null } as const;
  const start = toKinshasaDate(input.date);
  const dayWhere = {
    placeId: place.id,
    dateTime: { gte: start, lt: new Date(start.getTime() + 86400000) },
  };
  const [reservations, counts, availability] = await Promise.all([
    db.reservation.findMany({
      where: input.all ? { placeId: place.id } : dayWhere,
      include: {
        customer: { select: { name: true, email: true } },
        history: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            fromStatus: true,
            toStatus: true,
            actorRole: true,
            createdAt: true,
          },
        },
      },
      orderBy: [{ dateTime: input.all ? "desc" : "asc" }, { id: "asc" }],
      skip: (input.page - 1) * 50,
      take: 51,
    }),
    db.reservation.groupBy({
      by: ["status"],
      where: dayWhere,
      _count: { _all: true },
      _sum: { partySize: true },
    }),
    getDayAvailability(db, place, input.date),
  ]);
  const active = counts.filter((c) => ACTIVE_STATUSES.includes(c.status));
  return {
    places,
    place,
    reservations: reservations.slice(0, 50),
    hasNext: reservations.length > 50,
    availability,
    summary: {
      active: active.reduce((n, c) => n + c._count._all, 0),
      guests: active.reduce((n, c) => n + (c._sum.partySize || 0), 0),
      pending: counts.find((c) => c.status === "PENDING")?._count._all || 0,
      completed: counts.find((c) => c.status === "COMPLETED")?._count._all || 0,
      noShow: counts.find((c) => c.status === "NO_SHOW")?._count._all || 0,
    },
  } as const;
}
