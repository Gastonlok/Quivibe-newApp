import { after, NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deliverAdminEmails } from "@/features/admin/messages";
import { kinshasaDay, toKinshasaDate } from "@/features/reservations/domain";
import {
  notificationUserSelect,
  queueNotification,
} from "@/features/reservations/notifications";
import { serializable } from "@/features/reservations/service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret)
    return NextResponse.json(
      { error: "CRON_SECRET non configuré." },
      { status: 503 },
    );
  if (request.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const tomorrow = toKinshasaDate(
    kinshasaDay(new Date(Date.now() + 24 * 60 * 60_000)),
  );
  const candidates = await prisma.reservation.findMany({
    where: {
      status: "CONFIRMED",
      reminderSentAt: null,
      reminderQueuedAt: null,
      dateTime: {
        gte: tomorrow,
        lt: new Date(tomorrow.getTime() + 24 * 60 * 60_000),
      },
    },
    select: { id: true },
    orderBy: { dateTime: "asc" },
    take: 100,
  });
  const messageIds: string[] = [];
  for (const { id } of candidates) {
    const messageId = await serializable(prisma, async (tx) => {
      const reservation = await tx.reservation.findFirst({
        where: {
          id,
          status: "CONFIRMED",
          reminderQueuedAt: null,
          reminderSentAt: null,
        },
        include: {
          customer: { select: notificationUserSelect },
          place: { select: { name: true } },
        },
      });
      if (!reservation) return null;
      const when = new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "full",
        timeStyle: "short",
        timeZone: "Africa/Kinshasa",
      }).format(reservation.dateTime);
      const queued = await queueNotification(tx, {
        key: `reservation-reminder:${id}`,
        user: reservation.customer,
        reservationId: id,
        expectedReservationStatus: "CONFIRMED",
        expiresAt: reservation.dateTime,
        subject: `Rappel de réservation — ${reservation.place.name}`,
        body: `Votre réservation ${reservation.reference} chez ${reservation.place.name} est prévue le ${when} (Kinshasa), pour ${reservation.partySize} personne(s). Consultez « Mes réservations » pour voir le statut actuel ou annuler si nécessaire.`,
      });
      await tx.reservation.update({
        where: { id },
        data: { reminderQueuedAt: new Date() },
      });
      return queued;
    });
    if (messageId) messageIds.push(messageId);
  }
  if (messageIds.length)
    after(async () => {
      await deliverAdminEmails(messageIds);
    });
  return NextResponse.json({
    queued: messageIds.length,
    candidates: candidates.length,
  });
}
