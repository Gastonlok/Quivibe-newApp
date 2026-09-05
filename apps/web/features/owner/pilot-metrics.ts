import { kinshasaDay, toKinshasaDate } from "@/features/reservations/domain";

export type MetricVisit = {
  id: string;
  placeId: string;
  visitorKey: string;
  visitedAt: Date;
  channel: string;
};
export type MetricReservation = {
  placeId: string;
  createdAt: Date;
  dateTime: Date;
  status: string;
  partySize: number;
  attributedVisitId: string | null;
};

export function pilotPeriod(now = new Date(), days = 30) {
  const today = toKinshasaDate(kinshasaDay(now));
  return {
    start: new Date(today.getTime() - (days - 1) * 24 * 60 * 60_000),
    end: now,
  };
}

export function pilotMetrics(
  visits: MetricVisit[],
  reservations: MetricReservation[],
  start: Date,
  end: Date,
) {
  const inPeriod = (date: Date) => date >= start && date <= end;
  const periodVisits = visits.filter((v) => inPeriod(v.visitedAt));
  const tracked = periodVisits.filter((v) => v.channel !== "UNKNOWN");
  const eligible = new Map(tracked.map((v) => [v.id, v]));
  const visitors = new Set(periodVisits.map((v) => v.visitorKey));
  const trackedVisitors = new Set(tracked.map((v) => v.visitorKey));
  const converters = new Set<string>();
  for (const reservation of reservations) {
    const visit = reservation.attributedVisitId
      ? eligible.get(reservation.attributedVisitId)
      : undefined;
    if (
      visit &&
      visit.placeId === reservation.placeId &&
      reservation.createdAt >= visit.visitedAt &&
      reservation.createdAt <= end
    )
      converters.add(visit.visitorKey);
  }
  const created = reservations.filter((r) => inPeriod(r.createdAt));
  const due = reservations.filter((r) => inPeriod(r.dateTime));
  const completed = due.filter((r) => r.status === "COMPLETED");
  const cancelled = due.filter((r) => r.status === "CANCELLED").length;
  const noShow = due.filter((r) => r.status === "NO_SHOW").length;
  return {
    visits: periodVisits.length,
    visitors: visitors.size,
    trackedVisits: tracked.length,
    trackedVisitors: trackedVisitors.size,
    converters: converters.size,
    conversion: trackedVisitors.size
      ? (converters.size / trackedVisitors.size) * 100
      : null,
    created: created.length,
    unattributed: created.filter((r) => !r.attributedVisitId).length,
    due: due.length,
    completed: completed.length,
    completedGuests: completed.reduce((sum, r) => sum + r.partySize, 0),
    cancelled,
    cancellationRate: due.length ? (cancelled / due.length) * 100 : null,
    noShow,
    noShowRate:
      completed.length + noShow
        ? (noShow / (completed.length + noShow)) * 100
        : null,
    unresolved: due.filter((r) => ["PENDING", "CONFIRMED"].includes(r.status))
      .length,
  };
}
