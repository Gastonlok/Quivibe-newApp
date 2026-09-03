import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const roleSchema = z.object({
  role: z.enum(["USER", "OWNER", "ADMIN"]),
});

type Context = { params: Promise<{ userId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const parsed = roleSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
    }

    const { userId } = await params;
    if (userId === session.user.id && parsed.data.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Vous ne pouvez pas retirer votre propre rôle administrateur." },
        { status: 409 },
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        role: parsed.data.role,
        ownerStatus: parsed.data.role === "OWNER" ? "APPROVED" : undefined,
        ownerVerifiedAt: parsed.data.role === "OWNER" ? new Date() : undefined,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Erreur de mise à jour utilisateur:", error);
    return NextResponse.json({ error: "Impossible de modifier l'utilisateur" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { userId } = await params;
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas supprimer votre propre compte administrateur." },
        { status: 409 },
      );
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!target) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    if (target.role === "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Le dernier administrateur ne peut pas être supprimé." },
          { status: 409 },
        );
      }
    }

    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur de suppression utilisateur:", error);
    return NextResponse.json({ error: "Impossible de supprimer l'utilisateur" }, { status: 500 });
  }
}
