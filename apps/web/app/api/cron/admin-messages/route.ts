import { NextResponse } from "next/server";
import { deliverAdminEmails } from "@/features/admin/messages";
import { deliverNewsletter } from "@/features/newsletter/delivery";
import { prisma } from "@/lib/prisma";
export const maxDuration = 60;
export async function GET(request: Request) {
  if (
    !process.env.CRON_SECRET ||
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  )
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  await prisma.newsletterRateLimit.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  const messages = await deliverAdminEmails(undefined, 25000);
  const newsletter = await deliverNewsletter(prisma, { budgetMs: 25000 });
  return NextResponse.json({ ...messages, newsletter });
}
