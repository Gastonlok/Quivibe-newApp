import { describe, expect, it } from "vitest";
import {
  distanceKm,
  emptyRestaurantSearch,
  placeSearchHref,
  restaurantSearchSchema,
  searchHref,
  searchToParams,
} from "./search-params";

describe("shared restaurant search", () => {
  it("round-trips all filters through a shareable URL", () => {
    const filters = restaurantSearchSchema.parse({
      search: "Café & grillades",
      neighborhood: "Mont Ngafula",
      category: "restaurant",
      priceRange: "2,1,2",
      date: "2027-01-12",
      time: "19:15",
      partySize: "6",
      amenities: "TERRACE,PARKING",
      eventsOnly: "true",
      reservationsOnly: "true",
      minRating: "4.5",
      lat: "-4.31",
      lng: "15.28",
      radius: "10",
      sort: "distance",
      page: "2",
    });
    expect(filters.priceRange).toEqual([1, 2]);
    expect(
      restaurantSearchSchema.parse(Object.fromEntries(searchToParams(filters))),
    ).toEqual(filters);
    expect(searchHref(filters)).toContain("/discover?search=Caf%C3%A9");
  });
  it.each([
    { date: "2027-02-29", time: "19:00" },
    { date: "2027-01-12" },
    { time: "19:00" },
    { date: "2027-01-12", time: "24:00" },
    { partySize: "0" },
    { partySize: "31" },
    { page: "-1" },
    { page: "abc" },
    { priceRange: "1,9" },
    { lat: "90.01", lng: "0" },
    { lat: "-4.3" },
    { lat: "NaN", lng: "15" },
    { sort: "distance" },
    { minRating: "6" },
    { amenities: "FAKE" },
  ])("rejects malformed filters %j", (input) =>
    expect(restaurantSearchSchema.safeParse(input).success).toBe(false),
  );
  it("resets every criterion and does not attach a fictional booking date", () => {
    expect(searchHref(emptyRestaurantSearch())).toBe("/discover");
    expect(placeSearchHref("table-1", emptyRestaurantSearch())).toBe(
      "/places/table-1?qv_source=SEARCH",
    );
  });
  it("carries date, time and party size through to the reservation", () => {
    const filters = restaurantSearchSchema.parse({
      date: "2027-01-12",
      time: "19:15",
      partySize: "6",
    });
    const link = new URL(
      placeSearchHref("table-1", filters),
      "https://example.test",
    );
    expect(link.hash).toBe("#reservation");
    expect(Object.fromEntries(link.searchParams)).toEqual({
      qv_source: "SEARCH",
      date: "2027-01-12",
      time: "19:15",
      partySize: "6",
    });
  });
  it("measures geographic distance instead of comparing coordinate differences", () => {
    expect(distanceKm(-4.31, 15.28, -4.31, 15.28)).toBe(0);
    expect(distanceKm(0, 0, 0, 1)).toBeCloseTo(111.195, 2);
    expect(Number.isFinite(distanceKm(90, 0, -90, 180))).toBe(true);
  });
});
