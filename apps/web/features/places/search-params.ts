import { z } from "zod";
import { AMENITY_VALUES } from "./amenities";

export const SEARCH_KEYS = [
  "search",
  "location",
  "neighborhood",
  "category",
  "priceRange",
  "date",
  "time",
  "partySize",
  "minRating",
  "reservationsOnly",
  "eventsOnly",
  "amenities",
  "lat",
  "lng",
  "radius",
  "sort",
  "page",
] as const;
const text = (max: number) => z.string().trim().max(max).default("");
const date = z
  .string()
  .refine((v) => {
    if (!v) return true;
    const parsed = new Date(`${v}T12:00:00Z`);
    return (
      /^\d{4}-\d{2}-\d{2}$/.test(v) &&
      !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === v
    );
  }, "Date invalide")
  .default("");
const coordinate = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : Number(v)),
    z.number().finite().min(min).max(max).optional(),
  );

export const restaurantSearchSchema = z
  .object({
    search: text(100),
    location: text(120),
    neighborhood: text(100),
    category: text(80),
    priceRange: z
      .string()
      .regex(/^(?:[1-4](?:,[1-4])*)?$/)
      .default("")
      .transform((v) => [...new Set(v ? v.split(",").map(Number) : [])].sort()),
    date,
    time: z
      .string()
      .regex(/^(?:(?:[01]\d|2[0-3]):[0-5]\d)?$/)
      .default(""),
    partySize: z.coerce.number().int().min(1).max(30).default(2),
    minRating: z.coerce
      .number()
      .refine((v) => [0, 3, 4, 4.5].includes(v))
      .default(0),
    reservationsOnly: z
      .enum(["true", "false", ""])
      .default("")
      .transform((v) => v === "true"),
    eventsOnly: z
      .enum(["true", "false", ""])
      .default("")
      .transform((v) => v === "true"),
    amenities: text(200)
      .transform((v) => [...new Set(v ? v.split(",") : [])])
      .refine((values) =>
        values.every((v) =>
          AMENITY_VALUES.includes(v as (typeof AMENITY_VALUES)[number]),
        ),
      ),
    lat: coordinate(-90, 90),
    lng: coordinate(-180, 180),
    radius: z.coerce
      .number()
      .refine((v) => [2, 5, 10, 20].includes(v))
      .default(5),
    sort: z
      .enum(["relevance", "rating", "price", "recent", "distance"])
      .default("relevance"),
    page: z.coerce.number().int().min(1).max(10000).default(1),
  })
  .superRefine((value, ctx) => {
    if (Boolean(value.date) !== Boolean(value.time))
      ctx.addIssue({
        code: "custom",
        message: "Choisissez une date et une heure ensemble.",
        path: ["date"],
      });
    if ((value.lat === undefined) !== (value.lng === undefined))
      ctx.addIssue({
        code: "custom",
        message: "Position incomplète.",
        path: ["lat"],
      });
    if (value.sort === "distance" && value.lat === undefined)
      ctx.addIssue({
        code: "custom",
        message: "Activez la proximité pour trier par distance.",
        path: ["sort"],
      });
  });

export type RestaurantSearch = z.output<typeof restaurantSearchSchema>;
export type SearchInput = Partial<Record<(typeof SEARCH_KEYS)[number], string>>;
export const emptyRestaurantSearch = () => restaurantSearchSchema.parse({});

export function searchToParams(filters: RestaurantSearch) {
  const params = new URLSearchParams();
  for (const key of ["search", "location", "neighborhood", "category"] as const)
    if (filters[key]) params.set(key, filters[key]);
  if (filters.priceRange.length)
    params.set("priceRange", filters.priceRange.join(","));
  if (filters.date) {
    params.set("date", filters.date);
    params.set("time", filters.time);
    params.set("partySize", String(filters.partySize));
  }
  if (filters.minRating) params.set("minRating", String(filters.minRating));
  if (filters.reservationsOnly) params.set("reservationsOnly", "true");
  if (filters.eventsOnly) params.set("eventsOnly", "true");
  if (filters.amenities.length)
    params.set("amenities", filters.amenities.join(","));
  if (filters.lat !== undefined && filters.lng !== undefined) {
    params.set("lat", String(filters.lat));
    params.set("lng", String(filters.lng));
    params.set("radius", String(filters.radius));
  }
  if (filters.sort !== "relevance") params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));
  return params;
}

export function searchHref(filters: RestaurantSearch) {
  const query = searchToParams(filters).toString();
  return `/discover${query ? `?${query}` : ""}`;
}

export function placeSearchHref(
  slug: string,
  filters?: Pick<RestaurantSearch, "date" | "time" | "partySize">,
) {
  const params = new URLSearchParams({ qv_source: "SEARCH" });
  if (filters?.date) {
    params.set("date", filters.date);
    params.set("time", filters.time);
    params.set("partySize", String(filters.partySize));
  }
  return `/places/${encodeURIComponent(slug)}?${params}${filters?.date ? "#reservation" : ""}`;
}

export function distanceKm(
  lat: number,
  lng: number,
  targetLat: number,
  targetLng: number,
) {
  const rad = (n: number) => (n * Math.PI) / 180;
  const a =
    Math.sin(rad(targetLat - lat) / 2) ** 2 +
    Math.cos(rad(lat)) *
      Math.cos(rad(targetLat)) *
      Math.sin(rad(targetLng - lng) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(Math.min(1, a)));
}
