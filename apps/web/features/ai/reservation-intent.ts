export type ReservationIntent = {
  date: string;
  partySize: number;
  requestedTime: string | null;
  requiresAvailability: boolean;
};

function kinshasaDate(offsetDays: number) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Kinshasa",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const date = new Date(Date.UTC(year, month - 1, day + offsetDays));
  return date.toISOString().slice(0, 10);
}

export function parseReservationIntent(query: string): ReservationIntent | null {
  const request = query.toLowerCase();
  const requiresAvailability = /disponib|reserv|ce soir|aujourd'hui|aujourdhui|demain/.test(request);
  if (!requiresAvailability) return null;

  const partySize = Number(request.match(/(?:pour|a|à)\s*(\d{1,2})\s*(?:personnes?|pers\b)/)?.[1] || 2);
  const timeMatch = request.match(/(?:a|à|vers)\s*(\d{1,2})(?:\s*(?:h|:|heure)\s*(\d{2})?)?/);
  const hour = timeMatch ? Number(timeMatch[1]) : null;
  const minutes = timeMatch?.[2] ? Number(timeMatch[2]) : 0;
  const requestedTime = hour !== null && hour >= 0 && hour <= 23
    ? `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
    : null;

  return {
    date: kinshasaDate(/demain/.test(request) ? 1 : 0),
    partySize: Math.min(Math.max(partySize, 1), 30),
    requestedTime,
    requiresAvailability,
  };
}
