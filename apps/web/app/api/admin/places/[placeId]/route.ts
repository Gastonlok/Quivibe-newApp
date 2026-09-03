import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const statusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
});

type Context = { params: Promise<{ placeId: string }> };

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

    const { placeId } = await params;
    const place = await prisma.place.update({
      where: { id: placeId },
      data: { status: parsed.data.status },
    });

    return NextResponse.json({ place });
  } catch (error) {
    console.error("Erreur de mise à jour établissement:", error);
    return NextResponse.json({ error: "Impossible de modifier l'établissement" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { placeId } = await params;
    const place = await prisma.place.findUnique({
      where: { id: placeId },
      select: { id: true },
    });
    if (!place) {
      return NextResponse.json({ error: "Établissement introuvable" }, { status: 404 });
    }

    await prisma.place.delete({ where: { id: placeId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur de suppression établissement:", error);
    return NextResponse.json({ error: "Impossible de supprimer l'établissement" }, { status: 500 });
  }
}
