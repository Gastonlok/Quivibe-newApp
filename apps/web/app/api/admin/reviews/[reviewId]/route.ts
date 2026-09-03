import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statusSchema = z.object({
  status: z.enum(["APPROVED", "PENDING", "REJECTED"]),
});

type Context = { params: Promise<{ reviewId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const parsed = statusSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    const { reviewId } = await params;
    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { status: parsed.data.status },
    });
    return NextResponse.json({ review });
  } catch (error) {
    console.error("Erreur de modération d'avis:", error);
    return NextResponse.json({ error: "Impossible de modifier l'avis" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { reviewId } = await params;
    await prisma.review.delete({ where: { id: reviewId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur de suppression d'avis:", error);
    return NextResponse.json({ error: "Impossible de supprimer l'avis" }, { status: 500 });
  }
}
