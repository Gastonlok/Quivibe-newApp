import { z } from "zod";

export const subscriptionSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email("Saisissez une adresse e-mail valide.")
      .max(254)
      .transform((v) => v.toLowerCase()),
    consent: z.literal(true, {
      errorMap: () => ({
        message: "Acceptez de recevoir la newsletter pour vous inscrire.",
      }),
    }),
    website: z.string().max(200).default(""),
  })
  .strict();

export const campaignSchema = z
  .object({
    id: z.string().uuid(),
    revision: z.number().int().min(0),
    subject: z.string().trim().min(2).max(160),
    body: z.string().trim().min(10).max(10000),
  })
  .strict();

export const sendCampaignSchema = z
  .object({
    id: z.string().uuid(),
    revision: z.number().int().min(1),
  })
  .strict();
