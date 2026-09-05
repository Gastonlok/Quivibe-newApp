import type { SearchContext } from "./conversation";
import { normalize } from "./conversation";

export function bookingDate(value: string | null, now = new Date()): string | null {
  if (!value) return null;
  const text = normalize(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const parsed = new Date(`${text}T12:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === text ? text : null;
  }
  if (!/^(demain|aujourd'hui|ce soir)$/.test(text)) return null;
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Kinshasa", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)!.value;
  const date = new Date(`${get("year")}-${get("month")}-${get("day")}T12:00:00Z`);
  if (text === "demain") date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function bookingHref(slug: string, context: SearchContext) {
  const params = new URLSearchParams();
  const date = bookingDate(context.date);
  if (date) params.set("date", date);
  if (context.partySize) params.set("partySize", String(context.partySize));
  return `/places/${encodeURIComponent(slug)}${params.size ? `?${params}` : ""}#reservation`;
}
