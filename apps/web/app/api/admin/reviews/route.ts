import { NextResponse } from "next/server";
import { getAdminActor } from "@/features/admin/access";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const actor = await getAdminActor("REVIEWS");
  if (!actor) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const reviews = await prisma.review.findMany({
      include: {
        author: { select: { name: true, email: true } },
        place: { select: { name: true, slug: true } },
        _count: { select: { reports: { where: { status: "PENDING" } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Erreur de lecture des avis:", error);
    return NextResponse.json(
      { error: "Impossible de charger les avis" },
      { status: 500 },
    );
  }
}
