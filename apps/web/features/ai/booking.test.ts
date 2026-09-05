import { expect, it } from "vitest";
import { bookingDate, bookingHref } from "./booking";
import { updateContext } from "./conversation";

it("uses Kinshasa's date near UTC midnight and handles month rollover", () => {
  expect(bookingDate("aujourd'hui", new Date("2026-09-30T23:30:00Z"))).toBe(
    "2026-10-01",
  );
  expect(bookingDate("demain", new Date("2026-09-30T23:30:00Z"))).toBe(
    "2026-10-02",
  );
  expect(bookingDate("2026-02-30")).toBeNull();
  expect(bookingDate("ce weekend")).toBeNull();
});
it("passes explicit booking preferences to the real form", () => {
  expect(
    bookingHref("adresse-a", updateContext("On est 6 le 2026-10-10")),
  ).toBe(
    "/places/adresse-a?date=2026-10-10&partySize=6&qv_source=AI#reservation",
  );
  expect(bookingHref("adresse-a", updateContext("Je veux réserver"))).toBe(
    "/places/adresse-a?qv_source=AI#reservation",
  );
});
