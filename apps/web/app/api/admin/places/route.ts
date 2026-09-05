import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminActor } from "@/features/admin/access";

export async function GET() {
  try {
    const actor = await getAdminActor("PLACES");
    if (!actor) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const places = await prisma.place.findMany({
      include: {
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            favorites: true,
            events: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ places });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 },
    );
  }
}
