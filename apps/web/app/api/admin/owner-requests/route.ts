import { NextResponse } from "next/server";
import { getAdminActor } from "@/features/admin/access";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const actor = await getAdminActor("OWNER_REQUESTS");
  if (!actor) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const requests = await prisma.ownerRequest.findMany({
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Erreur de lecture des demandes propriétaires:", error);
    return NextResponse.json(
      { error: "Impossible de charger les demandes" },
      { status: 500 },
    );
  }
}
