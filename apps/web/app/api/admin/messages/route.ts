import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getAdminActor } from "@/features/admin/access";
import { messageSchema } from "@/features/admin/schema";
import { recipientFilter } from "@/features/admin/messages";
export const maxDuration = 60;

export async function GET() {
  if (!(await getAdminActor("MESSAGES")))
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const messages = await prisma.adminMessage.findMany({
    where: { kind: "ADMIN" },
    take: 50,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      subject: true,
      createdAt: true,
      audience: true,
      sendEmail: true,
      _count: { select: { recipients: true } },
    },
  });
  const deliveries = await prisma.messageRecipient.groupBy({
    by: ["messageId", "emailStatus"],
    where: { messageId: { in: messages.map((message) => message.id) } },
    _count: true,
  });
  return NextResponse.json({
    messages,
    deliveries,
    emailConfigured: Boolean(process.env.RESEND_API_KEY),
  });
}

export async function POST(request: Request) {
  const actor = await getAdminActor("MESSAGES");
  if (!actor)
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const parsed = messageSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return NextResponse.json(
      { error: "Vérifiez le sujet, le message et les destinataires." },
      { status: 400 },
    );
  const input = parsed.data;
  const requestFingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        subject: input.subject,
        body: input.body,
        audience: input.audience,
        sendEmail: input.sendEmail,
        userIds:
          input.audience === "SELECTED"
            ? [...new Set(input.userIds)].sort()
            : [],
      }),
    )
    .digest("hex");
  const where = recipientFilter(input.audience, input.userIds);
  if (input.preview) {
    const [count, emailCount, recipients] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.count({ where: { ...where, emailVerified: { not: null } } }),
      input.audience === "SELECTED"
        ? prisma.user.findMany({
            where,
            select: { id: true, name: true, email: true },
            orderBy: [{ name: "asc" }, { id: "asc" }],
            take: 500,
          })
        : Promise.resolve([]),
    ]);
    return NextResponse.json({
      count,
      emailCount,
      recipients,
      emailConfigured: Boolean(process.env.RESEND_API_KEY),
    });
  }
  try {
    const message = await prisma.$transaction(
      async (tx) => {
        const existing = await tx.adminMessage.findUnique({
          where: { requestKey: input.requestKey },
          select: { id: true, senderId: true, requestFingerprint: true },
        });
        if (existing) {
          if (
            existing.senderId !== actor.id ||
            existing.requestFingerprint !== requestFingerprint
          )
            throw new Error("Invalid request key");
          return existing;
        }
        const users = await tx.user.findMany({
          where,
          select: { id: true, emailVerified: true },
        });
        if (!users.length) throw new Error("No recipients");
        const created = await tx.adminMessage.create({
          data: {
            senderId: actor.id,
            requestKey: input.requestKey,
            requestFingerprint,
            subject: input.subject,
            body: input.body,
            audience: input.audience,
            sendEmail: input.sendEmail,
          },
        });
        for (let offset = 0; offset < users.length; offset += 500) {
          await tx.messageRecipient.createMany({
            data: users
              .slice(offset, offset + 500)
              .map((user) => ({
                messageId: created.id,
                userId: user.id,
                emailStatus: !input.sendEmail
                  ? "NOT_REQUESTED"
                  : user.emailVerified
                    ? "PENDING"
                    : "SKIPPED",
              })),
          });
        }
        await tx.adminAuditLog.create({
          data: {
            actorId: actor.id,
            action: "MESSAGE_CREATED",
            targetId: created.id,
            details: {
              audience: input.audience,
              count: users.length,
              sendEmail: input.sendEmail,
            },
          },
        });
        return created;
      },
      { timeout: 20000 },
    );
    return NextResponse.json(
      { id: message.id, success: true },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "Envoi non créé. Vérifiez les destinataires et réessayez avec le même message.",
      },
      { status: 409 },
    );
  }
}
