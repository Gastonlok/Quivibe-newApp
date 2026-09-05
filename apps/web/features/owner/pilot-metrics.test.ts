import { expect, it } from "vitest";
import {
  pilotMetrics,
  pilotPeriod,
  type MetricReservation,
  type MetricVisit,
} from "./pilot-metrics";
const start = new Date("2026-09-01T00:00Z"),
  end = new Date("2026-09-30T12:00Z");
const visit: MetricVisit = {
  id: "v1",
  placeId: "p1",
  visitorKey: "browser1",
  visitedAt: new Date("2026-09-10T12:00Z"),
  channel: "AI",
};
const reservation: MetricReservation = {
  placeId: "p1",
  createdAt: new Date("2026-09-10T12:05Z"),
  dateTime: new Date("2026-09-12T12:00Z"),
  status: "COMPLETED",
  partySize: 4,
  attributedVisitId: "v1",
};

it("counts each converting browser once, even for repeat bookings or cancellations", () => {
  const result = pilotMetrics(
    [visit, { ...visit, id: "v2", visitorKey: "browser2" }],
    [reservation, reservation, { ...reservation, status: "CANCELLED" }],
    start,
    end,
  );
  expect(result).toMatchObject({
    conversion: 50,
    converters: 1,
    created: 3,
    completed: 2,
    completedGuests: 8,
    cancelled: 1,
  });
});
it("does not invent a conversion for historical, unrelated or future activity", () => {
  expect(
    pilotMetrics([{ ...visit, channel: "UNKNOWN" }], [reservation], start, end)
      .conversion,
  ).toBeNull();
  const result = pilotMetrics(
    [visit],
    [
      { ...reservation, placeId: "other" },
      { ...reservation, createdAt: new Date("2026-08-01") },
      { ...reservation, createdAt: new Date("2026-10-01") },
      { ...reservation, attributedVisitId: null },
    ],
    start,
    end,
  );
  expect(result.conversion).toBe(0);
  expect(result.unattributed).toBe(1);
});
it("separates creation date from scheduled outcomes and excludes future outcomes", () => {
  const result = pilotMetrics(
    [],
    [
      { ...reservation, createdAt: new Date("2026-08-01") },
      { ...reservation, status: "CANCELLED", dateTime: new Date("2026-10-01") },
      { ...reservation, status: "CONFIRMED" },
      { ...reservation, status: "NO_SHOW" },
    ],
    start,
    end,
  );
  expect(result).toMatchObject({
    created: 3,
    due: 3,
    completed: 1,
    completedGuests: 4,
    cancelled: 0,
    noShow: 1,
    noShowRate: 50,
    unresolved: 1,
  });
});
it("returns unknown rates for empty cohorts and uses Kinshasa midnight", () => {
  expect(pilotMetrics([], [], start, end)).toMatchObject({
    conversion: null,
    cancellationRate: null,
    noShowRate: null,
  });
  expect(
    pilotPeriod(new Date("2026-09-30T23:30Z"), 7).start.toISOString(),
  ).toBe("2026-09-24T23:00:00.000Z");
});
