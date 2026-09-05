import { z } from "zod";
import { AMENITY_VALUES } from "@/features/places/amenities";
import { coordinatesSchema } from "@/features/places/location-schema";
import { optionalPhoneSchema } from "@/lib/phone";
import { reservationSettingsSchema } from "@/features/reservations/pricing";

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure invalide");

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export const ownerPlaceUpdateSchema = z
  .object({
    placeId: z.string().min(1),
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().min(20).max(2_000),
    address: z.string().trim().min(5).max(200),
    neighborhood: z.string().trim().min(2).max(100),
    ...coordinatesSchema.shape,
    priceRange: z.coerce.number().int().min(1).max(4),
    phone: optionalPhoneSchema,
    categoryIds: z.array(z.string().min(1)).min(1),
    amenities: z.array(z.enum(AMENITY_VALUES)).max(AMENITY_VALUES.length),
    ...reservationSettingsSchema.shape,
    reservationsEnabled: z.boolean(),
    reservationPrice:
      reservationSettingsSchema.shape.reservationPrice.removeDefault(),
    reservationCurrency:
      reservationSettingsSchema.shape.reservationCurrency.removeDefault(),
    reservationDuration: z.coerce.number().int().min(30).max(360),
    reservationCapacity: z.coerce.number().int().min(1).max(500),
    maxPartySize: z.coerce.number().int().min(1).max(50),
    autoConfirmReservations: z.boolean(),
    reservationStartTime: timeSchema,
    reservationEndTime: timeSchema,
    reservationInterval: z.coerce.number().int().min(15).max(120),
  })
  .superRefine((value, context) => {
    const start = timeToMinutes(value.reservationStartTime);
    const end = timeToMinutes(value.reservationEndTime);

    if (end <= start) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reservationEndTime"],
        message: "L'heure de fin doit etre apres l'heure de debut.",
      });
    }

    if (value.reservationDuration > end - start) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reservationDuration"],
        message: "La duree doit tenir dans la plage de reservation.",
      });
    }

    if (value.maxPartySize > value.reservationCapacity) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxPartySize"],
        message:
          "Le nombre maximal par table ne peut pas depasser la capacite.",
      });
    }
  });

export const ownerMediaUrlSchema = z.object({
  placeId: z.string().min(1),
  url: z.string().url().max(2_000),
  altText: z.string().trim().max(160).optional(),
});

const ownerMenuItemSchema = z.object({
  name: z.string().trim().min(2, "Chaque plat doit avoir un nom.").max(120),
  description: z.string().trim().max(300).optional(),
  price: z.string().trim().max(40).optional(),
  category: z.string().trim().max(80).optional(),
  available: z.boolean(),
  imageUrl: z.string().url().max(2000).nullable().optional(),
});

export const ownerPlaceMenuUpdateSchema = z.object({
  placeId: z.string().min(1),
  menuVisible: z.boolean(),
  items: z
    .array(ownerMenuItemSchema)
    .max(100, "Le menu ne peut pas contenir plus de 100 plats."),
});

export type OwnerPlaceUpdateInput = z.infer<typeof ownerPlaceUpdateSchema>;
export type OwnerPlaceMenuUpdateInput = z.infer<
  typeof ownerPlaceMenuUpdateSchema
>;
