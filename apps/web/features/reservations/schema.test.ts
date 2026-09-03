import { describe, expect, it } from "vitest";
import { createReservationSchema, reservationStatusSchema } from "./schema";

describe("reservation schemas", () => {
  it("accepts a valid reservation request", () => {
    expect(createReservationSchema.safeParse({ placeId: "place-1", date: "2027-01-12", time: "19:30", partySize: 2 }).success).toBe(true);
  });

  it("rejects invalid party sizes and statuses", () => {
    expect(createReservationSchema.safeParse({ placeId: "place-1", date: "2027-01-12", time: "19:30", partySize: 0 }).success).toBe(false);
    expect(reservationStatusSchema.safeParse("UNKNOWN").success).toBe(false);
  });
});
