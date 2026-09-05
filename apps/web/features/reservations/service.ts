import { createHash, randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import {
  ACTIVE_STATUSES,
  getScheduleSlots,
  kinshasaDay,
  toKinshasaDate,
  transitionError,
  MAX_RESERVATION_DURATION,
  MAX_BOOKING_DAYS,
  peakOccupiedSeats,
  reservationDayKey,
} from "./domain";
import type { CompletionInput, CreateReservationInput } from "./schema";
import {
  notificationUserSelect,
  queueNotification,
  queueReservationNotifications,
} from "./notifications";

export class ReservationError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function serializable<T>(
  db: PrismaClient,
  work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.$transaction(work, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10_000,
        timeout: 15_000,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ["P2034", "P2002"].includes(error.code) &&
        attempt < 3
      )
        continue;
      throw error;
    }
  }
}

export async function occupiedSeats(
  db: Pick<Prisma.TransactionClient, "reservation">,
  placeId: string,
  dateTime: Date,
  duration: number,
) {
  const result = await db.reservation.findMany({
    where: {
      placeId,
      status: { in: ACTIVE_STATUSES },
      dateTime: {
        gt: new Date(dateTime.getTime() - MAX_RESERVATION_DURATION * 60_000),
        lt: new Date(dateTime.getTime() + duration * 60_000),
      },
    },
    select: { dateTime: true, durationMinutes: true, partySize: true },
  });
  return peakOccupiedSeats(result, dateTime, duration);
}

const reservationInclude = {
  customer: { select: { ...notificationUserSelect, name: true } },
  place: {
    include: {
      owner: { select: notificationUserSelect },
      collaborators: { select: { userId: true, role: true } },
    },
  },
} satisfies Prisma.ReservationInclude;

export async function createReservation(
  db: PrismaClient,
  customerId: string,
  role: string,
  input: CreateReservationInput,
  visitorKey?: string,
) {
  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        customerId,
        placeId: input.placeId,
        date: input.date,
        time: input.time,
        partySize: input.partySize,
        phone: input.phone || null,
        specialRequest: input.specialRequest || null,
        ...(input.expectedPriceMinor !== undefined ||
        input.expectedCurrency !== undefined
          ? {
              expectedPriceMinor: input.expectedPriceMinor ?? 0,
              expectedCurrency: input.expectedCurrency ?? "USD",
            }
          : {}),
      }),
    )
    .digest("hex");
  return serializable(db, async (tx) => {
    const previous = await tx.reservation.findUnique({
      where: { requestKey: input.requestKey },
      select: {
        reference: true,
        status: true,
        customerId: true,
        requestFingerprint: true,
        place: { select: { slug: true } },
      },
    });
    if (previous) {
      if (
        previous.customerId !== customerId ||
        previous.requestFingerprint !== fingerprint
      )
        throw new ReservationError(
          "KEY_CONFLICT",
          "Cette demande a déjà été utilisée. Vérifiez vos réservations avant de recommencer.",
        );
      return {
        reference: previous.reference,
        status: previous.status,
        slug: previous.place.slug,
        messageIds: [] as string[],
      };
    }
    const dateTime = toKinshasaDate(input.date, input.time);
    if (dateTime.getTime() > Date.now() + MAX_BOOKING_DAYS * 86400000)
      throw new ReservationError(
        "TOO_FAR",
        "Choisissez une date dans l’année à venir.",
      );
    if (dateTime.getTime() < Date.now() + 60 * 60_000)
      throw new ReservationError(
        "TOO_SOON",
        "Choisissez un créneau au moins une heure à l’avance.",
      );
    const place = await tx.place.findFirst({
      where: {
        id: input.placeId,
        status: "APPROVED",
        reservationsEnabled: true,
      },
      include: { collaborators: { select: { userId: true } } },
    });
    if (!place)
      throw new ReservationError(
        "DISABLED",
        "Cet établissement ne prend pas encore de réservations.",
      );
    // Read the authoritative price inside the booking transaction. A browser
    // quote can only confirm it, never choose the price or commission.
    if (
      (input.expectedPriceMinor ?? 0) !== place.reservationPriceMinor ||
      (input.expectedCurrency ?? "USD") !== place.reservationCurrency
    )
      throw new ReservationError(
        "PRICE_CHANGED",
        "Le tarif a changé. Vérifiez le nouveau montant, puis confirmez à nouveau votre réservation.",
      );
    if (input.partySize > place.maxPartySize)
      throw new ReservationError(
        "PARTY_TOO_LARGE",
        `Maximum autorisé : ${place.maxPartySize} personnes.`,
      );
    if (!getScheduleSlots(place).includes(input.time))
      throw new ReservationError(
        "INVALID_SLOT",
        "Ce créneau n’est plus proposé par l’établissement.",
      );
    const day = await tx.reservationDay.findUnique({
      where: {
        placeId_date: {
          placeId: place.id,
          date: reservationDayKey(input.date),
        },
      },
    });
    if (day?.closed || day?.closedTimes.includes(input.time))
      throw new ReservationError(
        "SLOT_CLOSED",
        "Le restaurant a fermé ce créneau. Choisissez une autre heure ou une autre date.",
      );
    if (
      (await occupiedSeats(tx, place.id, dateTime, place.reservationDuration)) +
        input.partySize >
      place.reservationCapacity
    )
      throw new ReservationError(
        "NO_CAPACITY",
        "Ce créneau vient d’être complet. Choisissez une autre heure.",
      );
    const staff =
      role === "ADMIN" ||
      place.ownerId === customerId ||
      place.collaborators.some((c) => c.userId === customerId);
    const visit =
      visitorKey && !staff
        ? await tx.placeVisit.findFirst({
            where: {
              placeId: place.id,
              visitorKey,
              channel: { not: "UNKNOWN" },
              visitedAt: {
                gte: new Date(Date.now() - 30 * 60_000),
                lte: new Date(),
              },
            },
            orderBy: { visitedAt: "desc" },
            select: { id: true, channel: true },
          })
        : null;
    const status = place.autoConfirmReservations ? "CONFIRMED" : "PENDING";
    const reservation = await tx.reservation.create({
      data: {
        requestKey: input.requestKey,
        requestFingerprint: fingerprint,
        reference: `QV-${input.date.replaceAll("-", "")}-${randomUUID().slice(0, 8).toUpperCase()}`,
        dateTime,
        partySize: input.partySize,
        status,
        phone: input.phone || null,
        specialRequest: input.specialRequest || null,
        customerId,
        placeId: place.id,
        ownerIdAtBooking: place.ownerId,
        source: "QUIVIBE",
        attributedVisitId: visit?.id,
        channel: visit?.channel || "UNKNOWN",
        reservationPriceMinor: place.reservationPriceMinor,
        reservationCurrency: place.reservationCurrency,
        durationMinutes: place.reservationDuration,
        // Commercial activation and commission policy remain Quivibe's choice.
        // Neither owner settings nor a booking request can activate collection.
        commissionRate: new Prisma.Decimal(0),
        commissionAmount: new Prisma.Decimal(0),
        paymentStatus: "NOT_TRACKED",
        history: {
          create: {
            toStatus: status,
            actorId: customerId,
            actorRole: "CUSTOMER",
          },
        },
      },
      include: { ...reservationInclude, history: { select: { id: true } } },
    });
    const messageIds = await queueReservationNotifications(
      tx,
      reservation,
      reservation.history[0].id,
      true,
    );
    return {
      reference: reservation.reference,
      status,
      slug: place.slug,
      messageIds,
    };
  });
}

export async function changeReservationStatus(
  db: PrismaClient,
  actor: { id: string; role: string },
  reservationId: string,
  nextStatus: string,
  customer: boolean,
  completion: CompletionInput = {},
) {
  return serializable(db, async (tx) => {
    const reservation = await tx.reservation.findUnique({
      where: { id: reservationId },
      include: reservationInclude,
    });
    if (!reservation)
      throw new ReservationError("NOT_FOUND", "Réservation introuvable.");
    const access = customer
      ? reservation.customerId === actor.id
        ? "CUSTOMER"
        : null
      : actor.role === "ADMIN"
        ? "ADMIN"
        : reservation.place.ownerId === actor.id
          ? "OWNER"
          : reservation.place.collaborators.find((c) => c.userId === actor.id)
              ?.role;
    if (!access) throw new ReservationError("FORBIDDEN", "Accès refusé.");
    // A repeated response/retry must not create another event or change money.
    if (reservation.status === nextStatus) {
      if (
        completion.totalAmount !== undefined &&
        (!reservation.totalAmount?.equals(
          new Prisma.Decimal(completion.totalAmount),
        ) ||
          reservation.currency !== completion.currency)
      )
        throw new ReservationError(
          "CONFLICT",
          "Le résultat a déjà été enregistré avec un autre montant.",
        );
      return { slug: reservation.place.slug, messageIds: [] as string[] };
    }
    const error = transitionError(
      reservation.status,
      nextStatus,
      reservation.dateTime,
      new Date(),
      customer,
    );
    if (error) throw new ReservationError("INVALID_TRANSITION", error);
    const changed = await tx.reservation.updateMany({
      where: { id: reservation.id, status: reservation.status },
      data: {
        status: nextStatus,
        cancelledAt: nextStatus === "CANCELLED" ? new Date() : null,
        ...(nextStatus === "COMPLETED" && completion.totalAmount !== undefined
          ? {
              totalAmount: new Prisma.Decimal(completion.totalAmount),
              currency: completion.currency,
            }
          : {}),
      },
    });
    if (!changed.count)
      throw new ReservationError(
        "CONFLICT",
        "Cette réservation a changé. Actualisez la page.",
      );
    const event = await tx.reservationStatusEvent.create({
      data: {
        reservationId,
        fromStatus: reservation.status,
        toStatus: nextStatus,
        actorId: actor.id,
        actorRole: access,
      },
    });
    const messageIds = await queueReservationNotifications(
      tx,
      { ...reservation, status: nextStatus },
      event.id,
      false,
    );
    if (nextStatus === "CANCELLED" && reservation.dateTime > new Date()) {
      const date = toKinshasaDate(kinshasaDay(reservation.dateTime));
      const entries = await tx.reservationWaitlist.findMany({
        where: { placeId: reservation.placeId, date, status: "WAITING" },
        include: { customer: { select: notificationUserSelect } },
        orderBy: { createdAt: "asc" },
        take: 3,
      });
      for (const entry of entries) {
        const id = await queueNotification(tx, {
          key: `waitlist:${entry.id}:${event.id}`,
          user: entry.customer,
          subject: `Une table peut être disponible — ${reservation.place.name}`,
          body: `Une réservation a été annulée chez ${reservation.place.name} pour le ${kinshasaDay(date)}. Consultez la fiche du restaurant dans Quivibe pour vérifier les disponibilités. Aucune table ne vous est réservée automatiquement.`,
          expiresAt: new Date(date.getTime() + 24 * 60 * 60_000),
        });
        if (id) {
          messageIds.push(id);
          await tx.reservationWaitlist.update({
            where: { id: entry.id },
            data: { status: "NOTIFIED", notifiedAt: new Date() },
          });
        }
      }
    }
    return { slug: reservation.place.slug, messageIds };
  });
}
