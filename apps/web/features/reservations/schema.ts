import { z } from "zod";
import { optionalPhoneSchema } from "@/lib/phone";
import { MAX_RESERVATION_PRICE_MINOR } from "./pricing";

export const calendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T12:00:00Z`);
    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
  }, "Date invalide");

export const createReservationSchema = z
  .object({
    requestKey: z.string().uuid(),
    placeId: z.string().min(1),
    date: calendarDate,
    time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
    partySize: z.coerce.number().int().min(1).max(30),
    phone: optionalPhoneSchema,
    specialRequest: z.string().trim().max(500).optional(),
    expectedPriceMinor: z
      .number()
      .int()
      .min(0)
      .max(MAX_RESERVATION_PRICE_MINOR)
      .optional(),
    expectedCurrency: z.enum(["USD", "CDF"]).optional(),
  })
  .strict();

export const availabilitySchema = z.object({
  placeId: z.string().min(1),
  date: calendarDate,
  partySize: z.coerce.number().int().min(1).max(30),
});

export const reservationDayUpdateSchema = z
  .object({
    placeId: z.string().min(1),
    date: calendarDate,
    time: z
      .string()
      .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
      .optional(),
    closed: z.boolean(),
  })
  .strict();

export type ReservationDayUpdateInput = z.infer<
  typeof reservationDayUpdateSchema
>;

export const waitlistSchema = z.object({
  placeId: z.string().min(1),
  date: calendarDate,
  partySize: z.coerce.number().int().min(1).max(30),
});

export const reservationStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW",
]);

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type ReservationStatus = z.infer<typeof reservationStatusSchema>;

// Amounts remain decimal strings from the form to PostgreSQL. No float rounding.
export const completionSchema = z
  .object({
    totalAmount: z
      .string()
      .trim()
      .regex(/^(?:0|[1-9]\d{0,9})(?:[.,]\d{1,2})?$/)
      .transform((value) => value.replace(",", "."))
      .optional(),
    currency: z.enum(["CDF", "USD"]).optional(),
  })
  .strict()
  .refine(
    (value) =>
      Boolean(value.totalAmount !== undefined) === Boolean(value.currency),
    "Indiquez le montant et sa devise ensemble.",
  );

export type CompletionInput = z.input<typeof completionSchema>;
