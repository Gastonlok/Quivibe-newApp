import { z } from "zod";

export const createReservationSchema = z.object({
  placeId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  partySize: z.coerce.number().int().min(1).max(30),
  phone: z.string().trim().max(30).optional(),
  specialRequest: z.string().trim().max(500).optional(),
});

export const availabilitySchema = z.object({
  placeId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
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
