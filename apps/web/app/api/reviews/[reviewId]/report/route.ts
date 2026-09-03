import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reportReviewSchema } from "@/features/reviews/schema";

type Context = { params: Promise<{ reviewId: string }> };

export async function POST(request: Request, { params }: Context) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const parsed = reportReviewSchema.safeParse({ ...(await request.json()), reviewId: (await params).reviewId });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Signalement invalide." }, { status: 400 });

  const review = await prisma.review.findFirst({ where: { id: parsed.data.reviewId, status: "APPROVED" }, select: { id: true, authorId: true } });
  if (!review) return NextResponse.json({ error: "Avis introuvable." }, { status: 404 });
  if (review.authorId === session.user.id) return NextResponse.json({ error: "Vous ne pouvez pas signaler votre propre avis." }, { status: 400 });

  try {
    await prisma.reviewReport.create({ data: { reviewId: review.id, reporterId: session.user.id, reason: parsed.data.reason.trim() } });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Vous avez deja signale cet avis." }, { status: 409 });
  }
}
