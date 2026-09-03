"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  availabilitySchema,
  createReservationSchema,
  reservationStatusSchema,
  type CreateReservationInput,
} from "./schema";

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED"] as const;

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

async function occupiedSeats(
  placeId: string,
  dateTime: Date,
  durationMinutes: number,
) {
  const windowStart = new Date(dateTime.getTime() - durationMinutes * 60_000);
  const windowEnd = new Date(dateTime.getTime() + durationMinutes * 60_000);

  const reservations = await prisma.reservation.findMany({
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

  const occupied = await occupiedSeats(place.id, dateTime, place.reservationDuration);
  if (occupied + input.partySize > place.reservationCapacity) {
    return { success: false as const, code: "NO_CAPACITY", error: "Ce créneau vient d’être complet. Choisissez une autre heure." };
  }

  const status = place.autoConfirmReservations ? "CONFIRMED" : "PENDING";
  const reservation = await prisma.reservation.create({
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

  revalidatePath(`/places/${place.slug}`);
  revalidatePath("/reservations");
  revalidatePath("/owner/reservations");

  return {
    success: true as const,
    reference: reservation.reference,
    status: reservation.status,
  };
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
    select: { id: true, dateTime: true, status: true },
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

  revalidatePath("/reservations");
  revalidatePath("/owner/reservations");
  return { success: true as const };
}

export async function listOwnerReservationsAction() {
  const session = await auth();
  if (!session?.user?.id || !["OWNER", "ADMIN"].includes(session.user.role)) return [];

  return prisma.reservation.findMany({
    where:
      session.user.role === "ADMIN"
        ? {}
        : { place: { ownerId: session.user.id } },
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
  if (!session?.user?.id || !["OWNER", "ADMIN"].includes(session.user.role)) {
    return { success: false as const, error: "Non autorisé." };
  }

  const parsedStatus = reservationStatusSchema.safeParse(nextStatus);
  if (!parsedStatus.success || parsedStatus.data === "PENDING") {
    return { success: false as const, error: "Statut invalide." };
  }

  const reservation = await prisma.reservation.findFirst({
    where: {
      id: reservationId,
      ...(session.user.role === "ADMIN"
        ? {}
        : { place: { ownerId: session.user.id } }),
    },
    select: { id: true, status: true },
  });
  if (!reservation) return { success: false as const, error: "Réservation introuvable." };

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
