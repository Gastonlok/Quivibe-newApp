"use server";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlaceAccess, hasOwnerWorkspaceAccess } from "@/features/owner/access";
import { sendReservationEmail, sendWaitlistAvailabilityEmail } from "@/lib/email";
import {
  availabilitySchema,
  createReservationSchema,
  reservationStatusSchema,
  waitlistSchema,
  type CreateReservationInput,
} from "./schema";

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED"] as const;

class ReservationCapacityError extends Error {}

type ReservationReader = Pick<Prisma.TransactionClient, "reservation">;

function toKinshasaDate(date: string, time: string) {
  return new Date(`${date}T${time}:00+01:00`);
}

type ReservationSchedule = {
  reservationStartTime: string;
  reservationEndTime: string;
  reservationInterval: number;
  reservationDuration: number;
};

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function getScheduleSlots(schedule: ReservationSchedule) {
  const start = timeToMinutes(schedule.reservationStartTime);
  const end = timeToMinutes(schedule.reservationEndTime);
  const slots: string[] = [];

  for (
    let minutes = start;
    minutes + schedule.reservationDuration <= end;
    minutes += schedule.reservationInterval
  ) {
    slots.push(minutesToTime(minutes));
  }

  return slots;
}

function formatReference(date: string) {
  const day = date.replaceAll("-", "");
  return `QV-${day}-${randomUUID().slice(0, 6).toUpperCase()}`;
}

function dayRange(dateTime: Date) {
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Kinshasa" }).format(dateTime);
  const start = toKinshasaDate(date, "00:00");
  return { gte: start, lt: new Date(start.getTime() + 24 * 60 * 60_000) };
}

async function occupiedSeats(
  db: ReservationReader,
  placeId: string,
  dateTime: Date,
  durationMinutes: number,
) {
  const windowStart = new Date(dateTime.getTime() - durationMinutes * 60_000);
  const windowEnd = new Date(dateTime.getTime() + durationMinutes * 60_000);

  const reservations = await db.reservation.findMany({
    where: {
      placeId,
      status: { in: [...ACTIVE_STATUSES] },
      dateTime: { gt: windowStart, lt: windowEnd },
    },
    select: { partySize: true },
  });

  return reservations.reduce((total, item) => total + item.partySize, 0);
}

export async function getAvailableSlotsAction(raw: {
  placeId: string;
  date: string;
  partySize: number;
}) {
  const parsed = availabilitySchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false as const, slots: [], error: "Paramètres de disponibilité invalides." };
  }
  const input = parsed.data;

  const place = await prisma.place.findFirst({
    where: {
      id: input.placeId,
      status: "APPROVED",
      reservationsEnabled: true,
    },
    select: {
      reservationCapacity: true,
      reservationDuration: true,
      maxPartySize: true,
      reservationStartTime: true,
      reservationEndTime: true,
      reservationInterval: true,
    },
  });

  if (!place) return { success: false as const, slots: [], error: "Réservation indisponible." };
  if (input.partySize < 1 || input.partySize > place.maxPartySize) {
    return { success: false as const, slots: [], error: "Nombre de personnes non autorisé." };
  }

  const slots: string[] = [];
  for (const time of getScheduleSlots(place)) {
    const dateTime = toKinshasaDate(input.date, time);
    if (dateTime.getTime() < Date.now() + 60 * 60_000) continue;

    const occupied = await occupiedSeats(
      prisma,
      input.placeId,
      dateTime,
      place.reservationDuration,
    );
    if (occupied + input.partySize <= place.reservationCapacity) {
      slots.push(time);
    }
  }

  return { success: true as const, slots };
}

export async function createReservationAction(raw: CreateReservationInput) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, code: "UNAUTHENTICATED", error: "Connexion requise." };
  }

  const parsed = createReservationSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false as const, code: "INVALID_INPUT", error: "Informations de réservation invalides." };
  }

  const input = parsed.data;
  const dateTime = toKinshasaDate(input.date, input.time);
  if (dateTime.getTime() < Date.now() + 60 * 60_000) {
    return { success: false as const, code: "TOO_SOON", error: "Choisissez un créneau au moins une heure à l’avance." };
  }

  const place = await prisma.place.findFirst({
    where: { id: input.placeId, status: "APPROVED" },
    select: {
      id: true,
      name: true,
      slug: true,
      reservationsEnabled: true,
      reservationCapacity: true,
      reservationDuration: true,
      maxPartySize: true,
      autoConfirmReservations: true,
      reservationStartTime: true,
      reservationEndTime: true,
      reservationInterval: true,
    },
  });

  if (!place?.reservationsEnabled) {
    return { success: false as const, code: "DISABLED", error: "Cet établissement ne prend pas encore de réservations." };
  }
  if (input.partySize > place.maxPartySize) {
    return { success: false as const, code: "PARTY_TOO_LARGE", error: `Maximum autorisé : ${place.maxPartySize} personnes.` };
  }

  if (!getScheduleSlots(place).includes(input.time)) {
    return { success: false as const, code: "INVALID_SLOT", error: "Ce creneau n'est plus propose par l'etablissement." };
  }

  const status = place.autoConfirmReservations ? "CONFIRMED" : "PENDING";
  let reservation: { reference: string; status: string } | undefined;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      reservation = await prisma.$transaction(async (tx) => {
        const occupied = await occupiedSeats(tx, place.id, dateTime, place.reservationDuration);
        if (occupied + input.partySize > place.reservationCapacity) {
          throw new ReservationCapacityError();
        }

        return tx.reservation.create({
          data: {
            reference: formatReference(input.date),
            dateTime,
            partySize: input.partySize,
            status,
            phone: input.phone || null,
            specialRequest: input.specialRequest || null,
            customerId: session.user.id,
            placeId: place.id,
          },
          select: { reference: true, status: true },
        });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      break;
    } catch (error) {
      if (error instanceof ReservationCapacityError) {
        return { success: false as const, code: "NO_CAPACITY", error: "Ce créneau vient d’être complet. Choisissez une autre heure." };
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034" && attempt < 2) continue;
      console.error("Erreur de transaction de réservation:", error);
      return { success: false as const, code: "NO_CAPACITY", error: "Ce créneau vient d’être complet. Choisissez une autre heure." };
    }
  }

  if (!reservation) {
    return { success: false as const, code: "NO_CAPACITY", error: "Ce créneau vient d’être complet. Choisissez une autre heure." };
  }

  revalidatePath(`/places/${place.slug}`);
  revalidatePath("/reservations");
  revalidatePath("/owner/reservations");

  void sendReservationEmail({
    email: session.user.email,
    name: session.user.name,
    placeName: place.name,
    reference: reservation.reference,
    dateTime,
    status: reservation.status,
  });

  return {
    success: true as const,
    reference: reservation.reference,
    status: reservation.status,
  };
}

export async function joinReservationWaitlistAction(raw: { placeId: string; date: string; partySize: number }) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, code: "UNAUTHENTICATED", error: "Connexion requise." };
  const parsed = waitlistSchema.safeParse(raw);
  if (!parsed.success) return { success: false as const, code: "INVALID_INPUT", error: "Informations de liste d'attente invalides." };

  const input = parsed.data;
  const place = await prisma.place.findFirst({
    where: { id: input.placeId, status: "APPROVED", reservationsEnabled: true },
    select: { id: true, maxPartySize: true },
  });
  if (!place || input.partySize > place.maxPartySize) return { success: false as const, code: "UNAVAILABLE", error: "Cet etablissement ne peut pas recevoir cette demande." };

  const date = toKinshasaDate(input.date, "00:00");
  await prisma.reservationWaitlist.upsert({
    where: { placeId_customerId_date: { placeId: place.id, customerId: session.user.id, date } },
    create: { placeId: place.id, customerId: session.user.id, date, partySize: input.partySize },
    update: { partySize: input.partySize, status: "WAITING", notifiedAt: null },
  });
  return { success: true as const };
}

export async function listMyReservationsAction() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.reservation.findMany({
    where: { customerId: session.user.id },
    include: {
      place: {
        select: {
          name: true,
          slug: true,
          neighborhood: true,
          phone: true,
          media: { take: 1, select: { url: true, altText: true } },
        },
      },
    },
    orderBy: { dateTime: "desc" },
  });
}

export async function cancelMyReservationAction(reservationId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: "Connexion requise." };

  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, customerId: session.user.id },
    select: { id: true, reference: true, dateTime: true, status: true, partySize: true, placeId: true, place: { select: { name: true, slug: true } } },
  });

  if (!reservation) return { success: false as const, error: "Réservation introuvable." };
  if (!ACTIVE_STATUSES.includes(reservation.status as (typeof ACTIVE_STATUSES)[number])) {
    return { success: false as const, error: "Cette réservation ne peut plus être annulée." };
  }
  if (reservation.dateTime.getTime() <= Date.now()) {
    return { success: false as const, error: "Une réservation passée ne peut pas être annulée." };
  }

  await prisma.reservation.update({
    where: { id: reservation.id },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });

  const waitingEntries = await prisma.reservationWaitlist.findMany({
    where: { placeId: reservation.placeId, date: dayRange(reservation.dateTime), status: "WAITING" },
    include: { customer: { select: { name: true, email: true } } },
    orderBy: { createdAt: "asc" },
    take: 3,
  });
  await Promise.all(waitingEntries.map(async (entry) => {
    const notification = await sendWaitlistAvailabilityEmail(entry.customer.email, entry.customer.name, reservation.place.name, reservation.place.slug);
    if (notification.success) {
      await prisma.reservationWaitlist.update({ where: { id: entry.id }, data: { status: "NOTIFIED", notifiedAt: new Date() } });
    }
  }));

  void sendReservationEmail({
    email: session.user.email,
    name: session.user.name,
    placeName: reservation.place.name,
    reference: reservation.reference,
    dateTime: reservation.dateTime,
    status: "CANCELLED",
  });

  revalidatePath("/reservations");
  revalidatePath("/owner/reservations");
  return { success: true as const };
}

export async function listOwnerReservationsAction() {
  const session = await auth();
  if (!session?.user?.id || !(await hasOwnerWorkspaceAccess(session.user.id, session.user.role))) return [];

  return prisma.reservation.findMany({
    where:
      session.user.role === "ADMIN"
        ? {}
        : { place: { OR: [{ ownerId: session.user.id }, { collaborators: { some: { userId: session.user.id } } }] } },
    include: {
      customer: { select: { name: true, email: true } },
      place: { select: { name: true, slug: true } },
    },
    orderBy: { dateTime: "asc" },
  });
}

export async function updateReservationStatusAction(
  reservationId: string,
  nextStatus: string,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Non autorisé." };
  }

  const parsedStatus = reservationStatusSchema.safeParse(nextStatus);
  if (!parsedStatus.success || parsedStatus.data === "PENDING") {
    return { success: false as const, error: "Statut invalide." };
  }

  const reservation = await prisma.reservation.findFirst({
    where: {
      id: reservationId,
    },
    select: { id: true, status: true, placeId: true },
  });
  if (!reservation) return { success: false as const, error: "Réservation introuvable." };

  if (!(await getPlaceAccess(reservation.placeId))) {
    return { success: false as const, error: "Acces refuse." };
  }

  const allowedTransitions: Record<string, string[]> = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["COMPLETED", "NO_SHOW", "CANCELLED"],
  };
  if (!allowedTransitions[reservation.status]?.includes(parsedStatus.data)) {
    return { success: false as const, error: "Cette transition de statut n'est pas autorisée." };
  }

  await prisma.reservation.update({
    where: { id: reservation.id },
    data: {
      status: parsedStatus.data,
      cancelledAt: parsedStatus.data === "CANCELLED" ? new Date() : null,
    },
  });

  revalidatePath("/owner/reservations");
  revalidatePath("/reservations");
  return { success: true as const };
}
