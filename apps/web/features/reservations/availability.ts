import type { Prisma } from "@prisma/client";
import {
  ACTIVE_STATUSES,
  getScheduleSlots,
  MAX_RESERVATION_DURATION,
  MAX_BOOKING_DAYS,
  peakOccupiedSeats,
  reservationDayKey,
  toKinshasaDate,
} from "./domain";

type Schedule = {
  reservationStartTime: string;
  reservationEndTime: string;
  reservationInterval: number;
  reservationDuration: number;
  reservationCapacity: number;
};

export async function getDayAvailability(
  db: Pick<Prisma.TransactionClient, "reservation" | "reservationDay">,
  place: Schedule & { id: string },
  date: string,
  now = new Date(),
) {
  const dayStart = toKinshasaDate(date);
  const [settings, bookings] = await Promise.all([
    db.reservationDay.findUnique({
      where: {
        placeId_date: { placeId: place.id, date: reservationDayKey(date) },
      },
    }),
    db.reservation.findMany({
      where: {
        placeId: place.id,
        status: { in: ACTIVE_STATUSES },
        dateTime: {
          gt: new Date(dayStart.getTime() - MAX_RESERVATION_DURATION * 60_000),
          lt: new Date(dayStart.getTime() + 86400000),
        },
      },
      select: { dateTime: true, durationMinutes: true, partySize: true },
    }),
  ]);
  return {
    closed: settings?.closed || false,
    slots: getScheduleSlots(place).map((time) => {
      const at = toKinshasaDate(date, time);
      const remaining = Math.max(
        0,
        place.reservationCapacity -
          peakOccupiedSeats(bookings, at, place.reservationDuration),
      );
      return {
        time,
        remaining,
        closed: Boolean(
          settings?.closed || settings?.closedTimes.includes(time),
        ),
        bookable:
          at.getTime() >= now.getTime() + 60 * 60_000 &&
          at.getTime() <= now.getTime() + MAX_BOOKING_DAYS * 86400000,
        past: at <= now,
      };
    }),
  };
}
