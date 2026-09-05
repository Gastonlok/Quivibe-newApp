import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendAdminMessageEmail } from "@/lib/email";

export function recipientFilter(
  audience: string,
  userIds: string[],
): Prisma.UserWhereInput {
  return {
    suspendedAt: null,
    ...(audience === "SELECTED"
      ? { id: { in: [...new Set(userIds)] } }
      : audience === "ALL"
        ? {}
        : { role: audience }),
  };
}

// Durable per-recipient queue: no email work is lost if a web request ends early.
export async function deliverAdminEmails(messageIds?: string[]) {
  if (!process.env.RESEND_API_KEY)
    return { sent: 0, failed: 0, unavailable: true };
  const stale = new Date(Date.now() - 5 * 60_000);
  await prisma.messageRecipient.updateMany({
    where: {
      emailStatus: "SENDING",
      emailAttempts: { gte: 3 },
      emailAttemptAt: { lt: stale },
    },
    data: {
      emailStatus: "FAILED",
      emailError:
        "Traitement interrompu après trois tentatives. Vérifiez le statut chez le prestataire.",
    },
  });
  const eligible: Prisma.MessageRecipientWhereInput = {
    ...(messageIds ? { messageId: { in: messageIds } } : {}),
    emailAttempts: { lt: 3 },
    OR: [
      { emailStatus: "PENDING" },
      { emailStatus: "FAILED", emailAttemptAt: { lt: stale } },
      { emailStatus: "SENDING", emailAttemptAt: { lt: stale } },
    ],
  };
  const entries = await prisma.messageRecipient.findMany({
    where: eligible,
    take: 20,
    orderBy: { id: "asc" },
    select: { id: true, emailFirstAttemptAt: true },
  });
  const deadline = Date.now() + 40_000;
  let sent = 0;
  let failed = 0;
  let processed = 0;
  for (const { id, emailFirstAttemptAt } of entries) {
    if (Date.now() > deadline) break;
    if (
      emailFirstAttemptAt &&
      emailFirstAttemptAt.getTime() < Date.now() - 23 * 60 * 60_000
    ) {
      const expired = await prisma.messageRecipient.updateMany({
        where: { id, ...eligible },
        data: {
          emailStatus: "FAILED",
          emailAttempts: 3,
          emailError:
            "Délai de protection contre les doublons dépassé. Vérifiez l’envoi chez le prestataire avant toute nouvelle campagne.",
        },
      });
      failed += expired.count;
      processed += expired.count;
      continue;
    }
    const claimed = await prisma.messageRecipient.updateMany({
      where: { id, ...eligible },
      data: {
        emailStatus: "SENDING",
        emailAttempts: { increment: 1 },
        emailAttemptAt: new Date(),
        ...(emailFirstAttemptAt ? {} : { emailFirstAttemptAt: new Date() }),
      },
    });
    if (!claimed.count) continue;
    processed++;
    const item = await prisma.messageRecipient.findUnique({
      where: { id },
      include: {
        user: {
          select: { email: true, emailVerified: true, suspendedAt: true },
        },
        message: {
          select: {
            subject: true,
            body: true,
            expiresAt: true,
            expectedReservationStatus: true,
            reservation: { select: { status: true } },
          },
        },
      },
    });
    if (!item) continue;
    if (
      (item.message.expiresAt &&
        item.message.expiresAt.getTime() <= Date.now()) ||
      (item.message.expectedReservationStatus &&
        item.message.reservation?.status !==
          item.message.expectedReservationStatus)
    ) {
      await prisma.messageRecipient.update({
        where: { id },
        data: {
          emailStatus: "SKIPPED",
          emailError: "Notification devenue obsolète.",
        },
      });
      continue;
    }
    if (item.user.suspendedAt || !item.user.emailVerified) {
      await prisma.messageRecipient.update({
        where: { id },
        data: {
          emailStatus: "SKIPPED",
          emailError: "Compte suspendu ou adresse e-mail non vérifiée.",
        },
      });
      continue;
    }
    const result = await sendAdminMessageEmail({
      to: item.user.email,
      subject: item.message.subject,
      body: item.message.body,
      idempotencyKey: `admin-message-${id}`,
    });
    await prisma.messageRecipient.update({
      where: { id },
      data: result.success
        ? { emailStatus: "SENT", emailSentAt: new Date(), emailError: null }
        : {
            emailStatus: "FAILED",
            emailError:
              "Le prestataire n’a pas confirmé l’envoi. Une nouvelle tentative sera effectuée (3 maximum).",
          },
    });
    if (result.success) sent++;
    else failed++;
    await new Promise((resolve) => setTimeout(resolve, 550));
  }
  return {
    sent,
    failed,
    processed,
    remaining: await prisma.messageRecipient.count({ where: eligible }),
    unavailable: false,
  };
}
