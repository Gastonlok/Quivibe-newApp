import { describe, expect, it } from "vitest";
import {
  completionSchema,
  createReservationSchema,
  reservationStatusSchema,
} from "./schema";

const valid = {
  requestKey: "3c7e2e16-7765-48f0-b8bf-cf1f06020b77",
  placeId: "place-1",
  date: "2027-01-12",
  time: "19:30",
  partySize: 2,
};

describe("reservation schemas", () => {
  it("accepts a valid reservation request", () => {
    expect(createReservationSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects invalid party sizes and statuses", () => {
    expect(
      createReservationSchema.safeParse({ ...valid, partySize: 0 }).success,
    ).toBe(false);
    expect(reservationStatusSchema.safeParse("UNKNOWN").success).toBe(false);
  });

  it.each(["2027-02-29", "2026-02-30", "2026-13-01"])(
    "rejects nonexistent calendar date %s",
    (date) => {
      expect(
        createReservationSchema.safeParse({ ...valid, date }).success,
      ).toBe(false);
    },
  );
  it.each(["24:00", "12:60", "-1:00"])("rejects invalid time %s", (time) => {
    expect(createReservationSchema.safeParse({ ...valid, time }).success).toBe(
      false,
    );
  });
  it("rejects client-controlled financial and attribution fields", () => {
    expect(
      createReservationSchema.safeParse({
        ...valid,
        commissionRate: 0.05,
        source: "AI",
      }).success,
    ).toBe(false);
    expect(
      createReservationSchema.safeParse({ ...valid, requestKey: undefined })
        .success,
    ).toBe(false);
  });
  it("preserves exact amounts and accepts an unknown amount", () => {
    expect(
      completionSchema.parse({ totalAmount: "9999999999,99", currency: "CDF" }),
    ).toEqual({ totalAmount: "9999999999.99", currency: "CDF" });
    expect(completionSchema.parse({})).toEqual({});
    expect(
      completionSchema.parse({ totalAmount: "0", currency: "USD" }).totalAmount,
    ).toBe("0");
  });
  it.each([
    { totalAmount: "2.345", currency: "USD" },
    { totalAmount: "-2", currency: "USD" },
    { totalAmount: "10" },
    { currency: "CDF" },
    { totalAmount: "1e4", currency: "USD" },
    { totalAmount: "10000000000", currency: "USD" },
    { commissionAmount: "5" },
  ])("rejects inconsistent or unsafe amounts %j", (input) => {
    expect(completionSchema.safeParse(input).success).toBe(false);
  });
});
