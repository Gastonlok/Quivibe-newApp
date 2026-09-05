import { z } from "zod";
import { MODERATION_PERMISSIONS } from "./permissions";

export const userUpdateSchema = z
  .object({
    role: z.enum(["USER", "OWNER", "ADMIN"]).optional(),
    suspended: z.boolean().optional(),
    moderationPermissions: z
      .array(z.enum(MODERATION_PERMISSIONS))
      .max(4)
      .optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0);

export const messageSchema = z
  .object({
    requestKey: z.string().uuid(),
    subject: z.string().trim().min(2).max(160),
    body: z.string().trim().min(2).max(5000),
    audience: z.enum(["SELECTED", "ALL", "USER", "OWNER", "ADMIN"]),
    userIds: z.array(z.string().min(1).max(100)).max(500).default([]),
    sendEmail: z.boolean().default(false),
    preview: z.boolean().default(false),
  })
  .strict()
  .refine(
    (value) => value.audience !== "SELECTED" || value.userIds.length > 0,
    "Choisissez au moins un destinataire.",
  );
