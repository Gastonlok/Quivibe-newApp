import { z } from "zod";

export const createPlaceSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(120),
  description: z.string().min(20, "Décris ton établissement en quelques phrases (20 caractères minimum)"),
  address: z.string().min(5, "Adresse trop courte"),
  neighborhood: z.string().min(2, "Quartier requis"),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  priceRange: z.coerce.number().int().min(1).max(4),
  phone: z.string().optional(),
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
