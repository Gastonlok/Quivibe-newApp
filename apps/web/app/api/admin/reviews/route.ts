import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
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
    return NextResponse.json({ error: "Impossible de charger les avis" }, { status: 500 });
  }
}
