import { randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { readNewsletterToken, newsletterRateKey } from "./tokens";

export const CONFIRMATION_LIFETIME = 72 * 3600000;
export class NewsletterError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
async function transaction<T>(
  db: PrismaClient,
  work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let n = 0; ; n++) {
    try {
      return await db.$transaction(work, {
        isolationLevel: "Serializable",
        maxWait: 10000,
        timeout: 15000,
      });
    } catch (error) {
      if (
        n < 3 &&
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ["P2034", "P2002"].includes(error.code)
      )
        continue;
      throw error;
    }
  }
}
export async function subscribe(
  db: PrismaClient,
  email: string,
  ip: string,
  now = new Date(),
) {
  const bucket = await db.newsletterRateLimit.upsert({
    where: { key: newsletterRateKey(ip, now) },
    create: {
      key: newsletterRateKey(ip, now),
      expiresAt: new Date(now.getTime() + 3600000),
    },
    update: { count: { increment: 1 } },
  });
  if (bucket.count > 8)
    throw new NewsletterError(
      "Trop de demandes. Réessayez dans une heure.",
      429,
    );
  return transaction(db, async (tx) => {
    let subscriber = await tx.newsletterSubscriber.findUnique({
      where: { email },
    });
    if (
      subscriber?.status === "ACTIVE" ||
      (subscriber &&
        now.getTime() - subscriber.requestedAt.getTime() < 10 * 60000)
    )
      return null;
    const tokenVersion = randomUUID();
    const data = {
      tokenVersion,
      status: "PENDING",
      consentAt: now,
      requestedAt: now,
      confirmedAt: null,
      unsubscribedAt: null,
    };
    subscriber = subscriber
      ? await tx.newsletterSubscriber.update({
          where: { id: subscriber.id },
          data,
        })
      : await tx.newsletterSubscriber.create({ data: { email, ...data } });
    const delivery = await tx.newsletterDelivery.create({
      data: {
        subscriberId: subscriber.id,
        tokenVersion,
        kind: "CONFIRMATION",
        dedupeKey: `confirm:${subscriber.id}:${tokenVersion}`,
      },
    });
    return delivery.id;
  });
}
export async function confirmSubscription(
  db: PrismaClient,
  token: unknown,
  now = new Date(),
) {
  const value = readNewsletterToken(token, "confirm");
  if (!value)
    throw new NewsletterError(
      "Ce lien est invalide ou a expiré. Inscrivez-vous à nouveau depuis le bas de page.",
    );
  return transaction(db, async (tx) => {
    const subscriber = await tx.newsletterSubscriber.findUnique({
      where: { id: value.id },
    });
    if (
      !subscriber ||
      subscriber.tokenVersion !== value.version ||
      subscriber.status === "UNSUBSCRIBED" ||
      (subscriber.status !== "ACTIVE" &&
        now.getTime() - subscriber.requestedAt.getTime() >
          CONFIRMATION_LIFETIME)
    )
      throw new NewsletterError(
        "Ce lien est invalide ou a expiré. Inscrivez-vous à nouveau depuis le bas de page.",
      );
    if (subscriber.status === "ACTIVE") return;
    await tx.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: { status: "ACTIVE", confirmedAt: now },
    });
  });
}
export async function unsubscribe(
  db: PrismaClient,
  token: unknown,
  now = new Date(),
) {
  const value = readNewsletterToken(token, "unsubscribe");
  if (!value)
    throw new NewsletterError("Le lien de désinscription est invalide.");
  return transaction(db, async (tx) => {
    const subscriber = await tx.newsletterSubscriber.findUnique({
      where: { id: value.id },
    });
    if (!subscriber || subscriber.tokenVersion !== value.version)
      throw new NewsletterError("Le lien de désinscription est invalide.");
    await tx.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: { status: "UNSUBSCRIBED", unsubscribedAt: now },
    });
    await tx.newsletterDelivery.updateMany({
      where: {
        subscriberId: subscriber.id,
        status: { in: ["PENDING", "FAILED"] },
      },
      data: { status: "SKIPPED" },
    });
  });
}
export async function saveCampaign(
  db: PrismaClient,
  input: { id: string; revision: number; subject: string; body: string },
  creatorId: string,
) {
  return transaction(db, async (tx) => {
    const existing = await tx.newsletterCampaign.findUnique({
      where: { id: input.id },
    });
    if (!existing) {
      if (input.revision !== 0)
        throw new NewsletterError("Ce brouillon n’existe plus.", 409);
      return tx.newsletterCampaign.create({
        data: {
          id: input.id,
          subject: input.subject,
          body: input.body,
          creatorId,
        },
      });
    }
    if (existing.status !== "DRAFT")
      throw new NewsletterError(
        "Une campagne lancée ne peut plus être modifiée.",
        409,
      );
    if (existing.subject === input.subject && existing.body === input.body)
      return existing;
    if (existing.revision !== input.revision)
      throw new NewsletterError(
        "Le brouillon a été modifié ailleurs. Rechargez-le.",
        409,
      );
    return tx.newsletterCampaign.update({
      where: { id: input.id },
      data: {
        subject: input.subject,
        body: input.body,
        revision: { increment: 1 },
      },
    });
  });
}
export async function queueCampaign(
  db: PrismaClient,
  id: string,
  revision: number,
  actorId: string,
) {
  return transaction(db, async (tx) => {
    const campaign = await tx.newsletterCampaign.findUnique({ where: { id } });
    if (!campaign) throw new NewsletterError("Newsletter introuvable.", 404);
    if (campaign.status !== "DRAFT") return campaign;
    if (campaign.revision !== revision)
      throw new NewsletterError(
        "Le brouillon a changé. Vérifiez son aperçu avant l’envoi.",
        409,
      );
    const subscribers = await tx.newsletterSubscriber.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, tokenVersion: true },
    });
    if (!subscribers.length)
      throw new NewsletterError("Aucun abonné confirmé pour le moment.");
    for (let offset = 0; offset < subscribers.length; offset += 500) {
      await tx.newsletterDelivery.createMany({
        data: subscribers.slice(offset, offset + 500).map((s) => ({
          subscriberId: s.id,
          tokenVersion: s.tokenVersion,
          kind: "CAMPAIGN",
          campaignId: id,
          dedupeKey: `campaign:${id}:${s.id}`,
        })),
      });
    }
    await tx.adminAuditLog.create({
      data: {
        actorId,
        action: "NEWSLETTER_QUEUED",
        targetId: id,
        details: { recipients: subscribers.length, revision },
      },
    });
    return tx.newsletterCampaign.update({
      where: { id },
      data: { status: "QUEUED", queuedAt: new Date() },
    });
  });
}
