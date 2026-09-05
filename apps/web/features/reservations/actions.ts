"use server";

import { after } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasOwnerWorkspaceAccess } from "@/features/owner/access";
import { deliverAdminEmails } from "@/features/admin/messages";
import {
  availabilitySchema,
  completionSchema,
  createReservationSchema,
  reservationStatusSchema,
  waitlistSchema,
  type CreateReservationInput,
  type CompletionInput,
} from "./schema";
import { getScheduleSlots, toKinshasaDate } from "./domain";
import {
  changeReservationStatus,
  createReservation,
  occupiedSeats,
  ReservationError,
} from "./service";

function finish(result: { slug: string; messageIds: string[] }) {
  for (const path of [
    `/places/${result.slug}`,
    "/reservations",
    "/owner/reservations",
    "/owner/analytics",
    "/owner/dashboard",
    "/messages",
  ])
    revalidatePath(path);
  if (result.messageIds.length)
    after(async () => {
      try {
        await deliverAdminEmails(result.messageIds);
      } catch {
        console.error(
          "Envoi différé des notifications interrompu ; la file sera reprise.",
        );
      }
    });
}

function failure(error: unknown) {
  if (error instanceof ReservationError)
    return { success: false as const, code: error.code, error: error.message };
  console.error("Opération de réservation interrompue.");
  return {
    success: false as const,
    code: "UNAVAILABLE",
    error:
      "Le service est momentanément indisponible. Réessayez ou consultez vos réservations.",
  };
}

export async function getAvailableSlotsAction(raw: {
  placeId: string;
  date: string;
  partySize: number;
}) {
  const parsed = availabilitySchema.safeParse(raw);
  if (!parsed.success)
    return {
      success: false as const,
      slots: [],
      error: "Paramètres de disponibilité invalides.",
    };
  const input = parsed.data;
  const place = await prisma.place.findFirst({
    where: { id: input.placeId, status: "APPROVED", reservationsEnabled: true },
    select: {
      reservationCapacity: true,
      reservationDuration: true,
      maxPartySize: true,
      reservationStartTime: true,
      reservationEndTime: true,
      reservationInterval: true,
    },
  });
  if (!place)
    return {
      success: false as const,
      slots: [],
      error: "Réservation indisponible.",
    };
  if (input.partySize > place.maxPartySize)
    return {
      success: false as const,
      slots: [],
      error: "Nombre de personnes non autorisé.",
    };
  const slots: string[] = [];
  for (const time of getScheduleSlots(place)) {
    const dateTime = toKinshasaDate(input.date, time);
    if (dateTime.getTime() < Date.now() + 60 * 60_000) continue;
    if (
      (await occupiedSeats(
        prisma,
        input.placeId,
        dateTime,
        place.reservationDuration,
      )) +
        input.partySize <=
      place.reservationCapacity
    )
      slots.push(time);
  }
  return { success: true as const, slots };
}

export async function createReservationAction(raw: CreateReservationInput) {
  const session = await auth();
  if (!session?.user?.id)
    return {
      success: false as const,
      code: "UNAUTHENTICATED",
      error: "Connexion requise.",
    };
  const parsed = createReservationSchema.safeParse(raw);
  if (!parsed.success)
    return {
      success: false as const,
      code: "INVALID_INPUT",
      error: "Informations de réservation invalides.",
    };
  try {
    const result = await createReservation(
      prisma,
      session.user.id,
      session.user.role,
      parsed.data,
      (await cookies()).get("qv_visitor")?.value,
    );
    finish(result);
    return {
      success: true as const,
      reference: result.reference,
      status: result.status,
    };
  } catch (error) {
    return failure(error);
  }
}

export async function joinReservationWaitlistAction(raw: {
  placeId: string;
  date: string;
  partySize: number;
}) {
  const session = await auth();
  if (!session?.user?.id)
    return {
      success: false as const,
      code: "UNAUTHENTICATED",
      error: "Connexion requise.",
    };
  const parsed = waitlistSchema.safeParse(raw);
  if (!parsed.success)
    return {
      success: false as const,
      code: "INVALID_INPUT",
      error: "Informations de liste d’attente invalides.",
    };
  const input = parsed.data;
  const date = toKinshasaDate(input.date);
  if (date.getTime() + 24 * 60 * 60_000 <= Date.now())
    return {
      success: false as const,
      code: "PAST_DATE",
      error: "Choisissez une date à venir.",
    };
  const place = await prisma.place.findFirst({
    where: { id: input.placeId, status: "APPROVED", reservationsEnabled: true },
    select: { id: true, maxPartySize: true },
  });
  if (!place || input.partySize > place.maxPartySize)
    return {
      success: false as const,
      code: "UNAVAILABLE",
      error: "Cet établissement ne peut pas recevoir cette demande.",
    };
  await prisma.reservationWaitlist.upsert({
    where: {
      placeId_customerId_date: {
        placeId: place.id,
        customerId: session.user.id,
        date,
      },
    },
    create: {
      placeId: place.id,
      customerId: session.user.id,
      date,
      partySize: input.partySize,
    },
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
  if (!session?.user?.id)
    return { success: false as const, error: "Connexion requise." };
  try {
    finish(
      await changeReservationStatus(
        prisma,
        session.user,
        reservationId,
        "CANCELLED",
        true,
      ),
    );
    return { success: true as const };
  } catch (error) {
    return failure(error);
  }
}

export async function listOwnerReservationsAction() {
  const session = await auth();
  if (
    !session?.user?.id ||
    !(await hasOwnerWorkspaceAccess(session.user.id, session.user.role))
  )
    return [];
  return prisma.reservation.findMany({
    where:
      session.user.role === "ADMIN"
        ? {}
        : {
            place: {
              OR: [
                { ownerId: session.user.id },
                { collaborators: { some: { userId: session.user.id } } },
              ],
            },
          },
    include: {
      customer: { select: { name: true, email: true } },
      place: { select: { name: true, slug: true } },
      history: {
        orderBy: { createdAt: "asc" },
        include: { actor: { select: { name: true } } },
      },
    },
    orderBy: { dateTime: "desc" },
  });
}

export async function updateReservationStatusAction(
  reservationId: string,
  nextStatus: string,
  rawCompletion: CompletionInput = {},
) {
  const session = await auth();
  if (!session?.user?.id)
    return { success: false as const, error: "Non autorisé." };
  const status = reservationStatusSchema.safeParse(nextStatus),
    completion = completionSchema.safeParse(rawCompletion);
  if (
    !status.success ||
    status.data === "PENDING" ||
    !completion.success ||
    (status.data !== "COMPLETED" && Object.keys(completion.data).length > 0)
  )
    return {
      success: false as const,
      error:
        "Statut ou montant invalide. Indiquez un montant positif et sa devise, ou laissez les deux vides.",
    };
  try {
    finish(
      await changeReservationStatus(
        prisma,
        session.user,
        reservationId,
        status.data,
        false,
        completion.data,
      ),
    );
    return { success: true as const };
  } catch (error) {
    return failure(error);
  }
}
