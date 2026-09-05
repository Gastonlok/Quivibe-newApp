import { after, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminActor } from "@/features/admin/access";
import {
  campaignSchema,
  sendCampaignSchema,
} from "@/features/newsletter/schema";
import {
  NewsletterError,
  queueCampaign,
  saveCampaign,
} from "@/features/newsletter/service";
import {
  newsletterFailure,
  sameOrigin,
  smallJson,
} from "@/features/newsletter/http";
import { deliverNewsletter } from "@/features/newsletter/delivery";

export const maxDuration = 60;
export async function GET(request: Request) {
  if (!(await getAdminActor("MESSAGES")))
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  try {
    const params = new URL(request.url).searchParams;
    const page = Math.min(
      10000,
      Math.max(1, Math.trunc(Number(params.get("page")) || 1)),
    );
    const query = (params.get("search") || "").trim().slice(0, 100);
    const where = query
      ? { email: { contains: query, mode: "insensitive" as const } }
      : {};
    const [subscribers, total, counts, campaigns] = await Promise.all([
      prisma.newsletterSubscriber.findMany({
        where,
        take: 50,
        skip: (page - 1) * 50,
        orderBy: { requestedAt: "desc" },
        select: {
          id: true,
          email: true,
          status: true,
          requestedAt: true,
          confirmedAt: true,
        },
      }),
      prisma.newsletterSubscriber.count({ where }),
      prisma.newsletterSubscriber.groupBy({ by: ["status"], _count: true }),
      prisma.newsletterCampaign.findMany({
        take: 25,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          subject: true,
          body: true,
          revision: true,
          status: true,
          createdAt: true,
          queuedAt: true,
        },
      }),
    ]);
    const deliveries = await prisma.newsletterDelivery.groupBy({
      by: ["campaignId", "status"],
      where: { campaignId: { in: campaigns.map((c) => c.id) } },
      _count: true,
    });
    return NextResponse.json({
      subscribers,
      total,
      page,
      counts,
      campaigns,
      deliveries,
      emailConfigured: Boolean(
        process.env.RESEND_API_KEY && process.env.AUTH_SECRET,
      ),
    });
  } catch (error) {
    return newsletterFailure(error);
  }
}
export async function POST(request: Request) {
  const actor = await getAdminActor("MESSAGES");
  if (!actor)
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  try {
    sameOrigin(request);
    const input = campaignSchema.safeParse(await smallJson(request));
    if (!input.success)
      throw new NewsletterError(
        "Vérifiez le sujet et le contenu de la newsletter.",
      );
    return NextResponse.json(await saveCampaign(prisma, input.data, actor.id));
  } catch (error) {
    return newsletterFailure(error);
  }
}
export async function PUT(request: Request) {
  const actor = await getAdminActor("MESSAGES");
  if (!actor)
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  try {
    sameOrigin(request);
    const input = sendCampaignSchema.safeParse(await smallJson(request));
    if (!input.success)
      throw new NewsletterError("Rechargez le brouillon avant l’envoi.");
    const campaign = await queueCampaign(
      prisma,
      input.data.id,
      input.data.revision,
      actor.id,
    );
    after(async () => {
      await deliverNewsletter(prisma).catch(() => {});
    });
    return NextResponse.json(campaign);
  } catch (error) {
    return newsletterFailure(error);
  }
}
