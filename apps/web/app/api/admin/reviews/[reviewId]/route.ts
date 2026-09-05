import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminActor } from "@/features/admin/access";
import { prisma } from "@/lib/prisma";

const statusSchema = z.object({
  status: z.enum(["APPROVED", "PENDING", "REJECTED"]),
});

type Context = { params: Promise<{ reviewId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const actor = await getAdminActor("REVIEWS");
  if (!actor) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const parsed = statusSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    const { reviewId } = await params;
    const review = await prisma.$transaction(async (tx) => {
      const result = await tx.review.update({
        where: { id: reviewId },
        data: { status: parsed.data.status },
      });
      if (parsed.data.status !== "PENDING")
        await tx.reviewReport.updateMany({
          where: { reviewId, status: "PENDING" },
          data: { status: "RESOLVED" },
        });
      await tx.adminAuditLog.create({
        data: {
          actorId: actor.id,
          action: "REVIEW_MODERATED",
          targetId: reviewId,
          details: parsed.data,
        },
      });
      return result;
    });
    return NextResponse.json({ review });
  } catch (error) {
    console.error("Erreur de modération d'avis:", error);
    return NextResponse.json(
      { error: "Impossible de modifier l'avis" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const actor = await getAdminActor("USERS");
  if (!actor) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const { reviewId } = await params;
    await prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id: reviewId } });
      await tx.adminAuditLog.create({
        data: {
          actorId: actor.id,
          action: "REVIEW_DELETED",
          targetId: reviewId,
        },
      });
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur de suppression d'avis:", error);
    return NextResponse.json(
      { error: "Impossible de supprimer l'avis" },
      { status: 500 },
    );
  }
}
