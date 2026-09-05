import { expect, it } from "vitest";
import {
  getScheduleSlots,
  kinshasaDay,
  toKinshasaDate,
  transitionError,
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
