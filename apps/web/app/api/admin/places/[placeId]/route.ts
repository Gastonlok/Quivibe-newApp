import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminActor } from "@/features/admin/access";

const statusSchema = z
  .object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
    ownerEmail: z.string().trim().email().optional(),
  })
  .strict()
  .refine((value) => value.status || value.ownerEmail);

type Context = { params: Promise<{ placeId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const actor = await getAdminActor("PLACES");
  if (!actor) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const parsed = statusSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }
    if (parsed.data.ownerEmail && actor.role !== "ADMIN")
      return NextResponse.json(
        { error: "La réaffectation est réservée à l’administrateur." },
        { status: 403 },
      );

    const { placeId } = await params;
    const place = await prisma.$transaction(async (tx) => {
      const owner = parsed.data.ownerEmail
        ? await tx.user.findFirst({
            where: {
              email: parsed.data.ownerEmail.toLowerCase(),
              suspendedAt: null,
              role: { in: ["OWNER", "ADMIN"] },
            },
            select: { id: true },
          })
        : null;
      if (parsed.data.ownerEmail && !owner) throw new Error("Unknown owner");
      const result = await tx.place.update({
        where: { id: placeId },
        data: {
          status: parsed.data.status,
          ...(owner ? { ownerId: owner.id } : {}),
        },
      });
      await tx.adminAuditLog.create({
        data: {
          actorId: actor.id,
          action: "PLACE_UPDATED",
          targetId: placeId,
          details: parsed.data,
        },
      });
      return result;
    });

    return NextResponse.json({ place });
  } catch (error) {
    console.error("Erreur de mise à jour établissement:", error);
    return NextResponse.json(
      { error: "Impossible de modifier l'établissement" },
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
    const { placeId } = await params;
    const place = await prisma.place.findUnique({
      where: { id: placeId },
      select: { id: true },
    });
    if (!place) {
      return NextResponse.json(
        { error: "Établissement introuvable" },
        { status: 404 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.placeCategory.deleteMany({ where: { placeId } });
      await tx.place.delete({ where: { id: placeId } });
      await tx.adminAuditLog.create({
        data: { actorId: actor.id, action: "PLACE_DELETED", targetId: placeId },
      });
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur de suppression établissement:", error);
    return NextResponse.json(
      { error: "Impossible de supprimer l'établissement" },
      { status: 500 },
    );
  }
}
