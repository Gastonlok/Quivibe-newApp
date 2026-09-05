import { z } from "zod";

// USD and CDF both use two decimal places. Keep integer minor units in storage
// and snapshots, avoiding floating point rounding and Decimal serialization.
export const MAX_RESERVATION_PRICE_MINOR = 2_147_483_647;

export function priceToMinor(value: string) {
  const [whole, fraction = ""] = value.replace(",", ".").split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

export function priceToInput(minor: number) {
  return `${Math.floor(minor / 100)}.${String(minor % 100).padStart(2, "0")}`;
}

export function formatReservationPrice(minor: number, currency: string) {
  return `${priceToInput(minor).replace(".", ",")} ${currency}`;
}

export const reservationPriceSchema = z
  .string()
  .trim()
  .regex(
    /^(?:0|[1-9]\d{0,7})(?:[.,]\d{1,2})?$/,
    "Indiquez un montant positif avec au maximum deux décimales.",
  )
  .refine(
    (value) => priceToMinor(value) <= MAX_RESERVATION_PRICE_MINOR,
    "Le montant ne peut pas dépasser 21 474 836,47.",
  );

export const reservationSettingsSchema = z.object({
  reservationsEnabled: z.boolean().default(true),
  reservationPrice: reservationPriceSchema.default("0"),
  reservationCurrency: z.enum(["USD", "CDF"]).default("USD"),
});
