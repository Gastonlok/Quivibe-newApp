import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReservationReminderEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET non configure." }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 23 * 60 * 60_000);
  const afterTomorrow = new Date(now.getTime() + 25 * 60 * 60_000);
  const reservations = await prisma.reservation.findMany({
    where: { status: "CONFIRMED", reminderSentAt: null, dateTime: { gte: tomorrow, lt: afterTomorrow } },
    include: { customer: { select: { name: true, email: true } }, place: { select: { name: true } } },
  });

  let sent = 0;
  for (const reservation of reservations) {
    const result = await sendReservationReminderEmail({
      email: reservation.customer.email,
      name: reservation.customer.name,
      placeName: reservation.place.name,
      reference: reservation.reference,
      dateTime: reservation.dateTime,
    });
    if (result.success) {
      await prisma.reservation.update({ where: { id: reservation.id }, data: { reminderSentAt: new Date() } });
      sent += 1;
    }
  }
  return NextResponse.json({ sent, candidates: reservations.length });
}
