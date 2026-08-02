import { z } from "zod";

export const createReviewSchema = z.object({
  placeId: z.string().min(1),
  rating: z.coerce.number().int().min(1, "Note requise").max(5),
  comment: z
    .string()
    .min(10, "Ton avis doit contenir au moins 10 caractères")
    .max(1000, "Ton avis est trop long (1000 caractères maximum)"),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const reportReviewSchema = z.object({
  reviewId: z.string().min(1),
  reason: z.string().min(5, "Précise la raison du signalement"),
});

export type ReportReviewInput = z.infer<typeof reportReviewSchema>;
