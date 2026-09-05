import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  const page = Math.max(
    1,
    Math.floor(Number(new URL(request.url).searchParams.get("page")) || 1),
  );
  const where = { userId: session.user.id };
  const [messages, total, unread] = await Promise.all([
    prisma.messageRecipient.findMany({
      where,
      take: 30,
      skip: (Math.min(page, 100000) - 1) * 30,
      orderBy: [{ message: { createdAt: "desc" } }, { id: "asc" }],
      select: {
        id: true,
        readAt: true,
        message: { select: { subject: true, body: true, createdAt: true } },
      },
    }),
    prisma.messageRecipient.count({ where }),
    prisma.messageRecipient.count({ where: { ...where, readAt: null } }),
  ]);
  return NextResponse.json({ messages, total, unread });
}
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  const parsed = z
    .object({ id: z.string().min(1).max(100) })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Message invalide" }, { status: 400 });
  const result = await prisma.messageRecipient.updateMany({
    where: { id: parsed.data.id, userId: session.user.id },
    data: { readAt: new Date() },
  });
  return result.count
    ? NextResponse.json({ success: true })
    : NextResponse.json({ error: "Message introuvable" }, { status: 404 });
}
