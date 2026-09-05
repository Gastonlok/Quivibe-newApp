import type { Prisma, PrismaClient } from "@prisma/client";
import {
  sendNewsletterCampaignEmail,
  sendNewsletterConfirmationEmail,
} from "@/lib/email";
import { siteUrl } from "@/lib/site";
import { newsletterToken } from "./tokens";
import { CONFIRMATION_LIFETIME } from "./service";

export async function deliverNewsletter(
  db: PrismaClient,
  options: { ids?: string[]; budgetMs?: number } = {},
) {
  if (!process.env.RESEND_API_KEY || !process.env.AUTH_SECRET)
    return { processed: 0, sent: 0, unavailable: true, ready: 0 };
  const deadline = Date.now() + (options.budgetMs ?? 40000);
  const stale = new Date(Date.now() - 5 * 60000);
  await db.newsletterDelivery.updateMany({
    where: {
      status: "SENDING",
      attempts: { gte: 3 },
      attemptAt: { lt: stale },
    },
    data: { status: "FAILED" },
  });
  const eligible: Prisma.NewsletterDeliveryWhereInput = {
    ...(options.ids ? { id: { in: options.ids } } : {}),
    attempts: { lt: 3 },
    OR: [
      { status: "PENDING" },
      { status: { in: ["FAILED", "SENDING"] }, attemptAt: { lt: stale } },
    ],
  };
  const entries = await db.newsletterDelivery.findMany({
    where: eligible,
    take: 20,
    orderBy: { createdAt: "asc" },
    select: { id: true, firstAttemptAt: true },
  });
  let processed = 0,
    sent = 0;
  for (const entry of entries) {
    if (Date.now() + 11000 > deadline) break;
    if (
      entry.firstAttemptAt &&
      Date.now() - entry.firstAttemptAt.getTime() > 23 * 3600000
    ) {
      await db.newsletterDelivery.updateMany({
        where: { ...eligible, id: entry.id },
        data: { status: "FAILED", attempts: 3 },
      });
      continue;
    }
    const claimed = await db.newsletterDelivery.updateMany({
      where: { ...eligible, id: entry.id },
      data: {
        status: "SENDING",
        attempts: { increment: 1 },
        attemptAt: new Date(),
        ...(entry.firstAttemptAt ? {} : { firstAttemptAt: new Date() }),
      },
    });
    if (!claimed.count) continue;
    processed++;
    const item = await db.newsletterDelivery.findUnique({
      where: { id: entry.id },
      include: { subscriber: true, campaign: true },
    });
    if (!item) continue;
    const subscriber = item.subscriber;
    const confirmation = item.kind === "CONFIRMATION";
    if (
      subscriber.tokenVersion !== item.tokenVersion ||
      (confirmation
        ? subscriber.status !== "PENDING" ||
          Date.now() - subscriber.requestedAt.getTime() > CONFIRMATION_LIFETIME
        : subscriber.status !== "ACTIVE" || item.campaign?.status !== "QUEUED")
    ) {
      await db.newsletterDelivery.update({
        where: { id: item.id },
        data: { status: "SKIPPED" },
      });
      continue;
    }
    const token = newsletterToken(
      subscriber.id,
      item.tokenVersion,
      "unsubscribe",
    );
    const unsubscribeUrl = `${siteUrl}/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
    const common = {
      to: subscriber.email,
      unsubscribeUrl,
      idempotencyKey: `newsletter-${item.id}`,
    };
    const result = confirmation
      ? await sendNewsletterConfirmationEmail({
          ...common,
          confirmUrl: `${siteUrl}/newsletter/confirm?token=${encodeURIComponent(newsletterToken(subscriber.id, item.tokenVersion, "confirm"))}`,
        })
      : await sendNewsletterCampaignEmail({
          ...common,
          subject: item.campaign!.subject,
          body: item.campaign!.body,
          oneClickUrl: `${siteUrl}/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`,
        });
    await db.newsletterDelivery.update({
      where: { id: item.id },
      data: {
        status: result.success ? "SENT" : "FAILED",
        ...(result.success ? { sentAt: new Date() } : {}),
      },
    });
    if (result.success) sent++;
    await new Promise((resolve) => setTimeout(resolve, 550));
  }
  return {
    processed,
    sent,
    unavailable: false,
    ready: await db.newsletterDelivery.count({ where: eligible }),
  };
}
