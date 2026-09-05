import { describe, expect, it } from "vitest";
import { ownerPlaceUpdateSchema } from "@/features/owner/schema";
import {
  formatReservationPrice,
  priceToInput,
  priceToMinor,
  reservationSettingsSchema,
} from "./pricing";

describe("reservation pricing", () => {
  it.each([
    ["0", 0],
    ["0.29", 29],
    ["12,50", 1250],
    ["21474836.47", 2147483647],
  ])("preserves exact cents for %s", (price, minor) => {
    const parsed = reservationSettingsSchema.parse({ reservationPrice: price });
    expect(priceToMinor(parsed.reservationPrice)).toBe(minor);
    expect(priceToMinor(priceToInput(minor as number))).toBe(minor);
  });
  it.each(["", "-1", "0.001", "1e3", "NaN", "21474836.48", "99999999999"])(
    "rejects invalid price %s",
    (reservationPrice) => {
      expect(
        reservationSettingsSchema.safeParse({ reservationPrice }).success,
      ).toBe(false);
    },
  );
  it("defaults existing places to free bookings and validates currencies", () => {
    expect(reservationSettingsSchema.parse({})).toEqual({
      reservationsEnabled: true,
      reservationPrice: "0",
      reservationCurrency: "USD",
    });
    expect(
      reservationSettingsSchema.safeParse({ reservationCurrency: "EUR" })
        .success,
    ).toBe(false);
    expect(formatReservationPrice(1250, "CDF")).toBe("12,50 CDF");
  });
  it("does not allow owner settings to change commissions or the commercial status", () => {
    const settings = ownerPlaceUpdateSchema.parse({
      placeId: "p",
      name: "Restaurant",
      description: "Un restaurant avec une terrasse.",
      address: "10 avenue",
      neighborhood: "Gombe",
      latitude: -4.3,
      longitude: 15.2,
      priceRange: 2,
      categoryIds: ["c"],
      amenities: [],
      reservationsEnabled: false,
      reservationPrice: "12,50",
      reservationCurrency: "CDF",
      reservationDuration: 120,
      reservationCapacity: 40,
      maxPartySize: 12,
      autoConfirmReservations: true,
      reservationStartTime: "11:00",
      reservationEndTime: "23:00",
      reservationInterval: 30,
      commissionRate: 0.2,
      commissionAmount: 100,
      commercialStatus: "PAID",
      paymentStatus: "PAID",
    });
    expect(settings).toMatchObject({
      reservationsEnabled: false,
      reservationPrice: "12,50",
      reservationCurrency: "CDF",
    });
    for (const field of [
      "commissionRate",
      "commissionAmount",
      "commercialStatus",
      "paymentStatus",
    ])
      expect(settings).not.toHaveProperty(field);
  });
});
