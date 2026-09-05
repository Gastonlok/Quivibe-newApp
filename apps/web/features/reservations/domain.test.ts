import { expect, it } from "vitest";
import {
  getScheduleSlots,
  kinshasaDay,
  toKinshasaDate,
  transitionError,
  peakOccupiedSeats,
  reservationDayKey,
} from "./domain";

it("uses the date in Kinshasa at month boundaries", () => {
  expect(kinshasaDay(new Date("2026-09-30T23:05:00Z"))).toBe("2026-10-01");
  expect(toKinshasaDate("2026-10-01").toISOString()).toBe(
    "2026-09-30T23:00:00.000Z",
  );
});
it("prevents premature outcomes and reopening terminal states", () => {
  const now = new Date("2026-09-30T12:00Z"),
    future = new Date("2026-09-30T13:00Z"),
    past = new Date("2026-09-30T11:00Z");
  expect(transitionError("CONFIRMED", "COMPLETED", future, now)).toBeTruthy();
  expect(transitionError("CONFIRMED", "NO_SHOW", future, now)).toBeTruthy();
  expect(transitionError("CONFIRMED", "COMPLETED", past, now)).toBeNull();
  expect(transitionError("CANCELLED", "CONFIRMED", future, now)).toBeTruthy();
  expect(
    transitionError("CONFIRMED", "CANCELLED", past, now, true),
  ).toBeTruthy();
  expect(transitionError("PENDING", "CANCELLED", future, now, true)).toBeNull();
});
it("handles invalid schedules without looping forever", () => {
  expect(
    getScheduleSlots({
      reservationStartTime: "11:00",
      reservationEndTime: "13:00",
      reservationDuration: 60,
      reservationInterval: 0,
    }),
  ).toEqual([]);
});

it("counts the peak occupancy, not the sum of groups arriving in succession", () => {
  const booking = (
    time: string,
    durationMinutes: number,
    partySize: number,
  ) => ({
    dateTime: toKinshasaDate("2026-10-01", time),
    durationMinutes,
    partySize,
  });
  const bookings = [booking("18:00", 120, 4), booking("20:00", 120, 4)];
  expect(
    peakOccupiedSeats(bookings, toKinshasaDate("2026-10-01", "19:00"), 120),
  ).toBe(4);
  expect(
    peakOccupiedSeats(
      [...bookings, booking("19:30", 60, 2)],
      toKinshasaDate("2026-10-01", "19:00"),
      120,
    ),
  ).toBe(6);
  expect(
    peakOccupiedSeats(bookings, toKinshasaDate("2026-10-01", "22:00"), 120),
  ).toBe(0);
});

it("preserves long booking durations and handles bookings across midnight", () => {
  const booking = {
    dateTime: toKinshasaDate("2026-09-30", "23:00"),
    durationMinutes: 180,
    partySize: 5,
  };
  expect(
    peakOccupiedSeats([booking], toKinshasaDate("2026-10-01", "01:30"), 30),
  ).toBe(5);
  expect(
    peakOccupiedSeats([booking], toKinshasaDate("2026-10-01", "02:00"), 30),
  ).toBe(0);
  expect(reservationDayKey("2026-10-01").toISOString()).toBe(
    "2026-10-01T00:00:00.000Z",
  );
});
