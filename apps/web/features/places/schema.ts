import { z } from "zod";
import { coordinatesSchema } from "./location-schema";
import { optionalPhoneSchema } from "@/lib/phone";
import { reservationSettingsSchema } from "@/features/reservations/pricing";

export const createPlaceSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(120),
  description: z
    .string()
    .min(
      20,
      "Décris ton établissement en quelques phrases (20 caractères minimum)",
    ),
  address: z.string().min(5, "Adresse trop courte"),
  neighborhood: z.string().min(2, "Quartier requis"),
  ...coordinatesSchema.shape,
  ...reservationSettingsSchema.shape,
  priceRange: z.coerce.number().int().min(1).max(4),
  phone: optionalPhoneSchema,
  categoryIds: z.array(z.string()).min(1, "Sélectionne au moins une catégorie"),
});

export type CreatePlaceInput = z.infer<typeof createPlaceSchema>;

export const listPlacesFilterSchema = z.object({
  search: z.string().optional(),
  categorySlug: z.string().optional(),
  neighborhood: z.string().optional(),
  priceRange: z.coerce.number().int().min(1).max(4).optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export type ListPlacesFilter = z.infer<typeof listPlacesFilterSchema>;
