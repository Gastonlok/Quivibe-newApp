import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminActor } from "@/features/admin/access";
import { userUpdateSchema } from "@/features/admin/schema";

type Context = { params: Promise<{ userId: string }> };
export async function PATCH(request: Request, { params }: Context) {
  const actor = await getAdminActor("USERS");
  if (!actor)
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const parsed = userUpdateSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return NextResponse.json(
      { error: "Modification invalide" },
      { status: 400 },
    );
  const { userId } = await params;
  const data = parsed.data;
  if (
    userId === actor.id &&
    (data.suspended || (data.role && data.role !== "ADMIN"))
  )
    return NextResponse.json(
      {
        error:
          "Vous ne pouvez pas désactiver votre propre accès administrateur.",
      },
      { status: 409 },
    );
  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const target = await tx.user.findUnique({
          where: { id: userId },
          select: { role: true, suspendedAt: true },
        });
        if (!target) return { error: "Compte introuvable", status: 404 };
        if (
          target.role === "ADMIN" &&
          !target.suspendedAt &&
          (data.suspended || (data.role && data.role !== "ADMIN")) &&
          (await tx.user.count({
            where: { role: "ADMIN", suspendedAt: null },
          })) <= 1
        )
          return {
            error: "Conservez au moins un administrateur actif.",
            status: 409,
          };
        const user = await tx.user.update({
          where: { id: userId },
          data: {
            ...(data.role
              ? { role: data.role, moderationPermissions: [] }
              : {}),
            ...(data.role === "OWNER"
              ? { ownerStatus: "APPROVED", ownerVerifiedAt: new Date() }
              : {}),
            ...(data.suspended === undefined
              ? {}
              : { suspendedAt: data.suspended ? new Date() : null }),
            ...(data.moderationPermissions
              ? {
                  moderationPermissions: [
                    ...new Set(data.moderationPermissions),
                  ],
                }
              : {}),
          },
          select: {
            id: true,
            name: true,
            role: true,
            suspendedAt: true,
            moderationPermissions: true,
          },
        });
        await tx.adminAuditLog.create({
          data: {
            actorId: actor.id,
            action: "USER_UPDATED",
            targetId: userId,
            details: data,
          },
        });
        return { user };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return "error" in result
      ? NextResponse.json({ error: result.error }, { status: result.status })
      : NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        error:
          "Modification concurrente ou impossible. Actualisez puis réessayez.",
      },
      { status: 409 },
    );
  }
}
export async function DELETE(_request: Request, { params }: Context) {
  const actor = await getAdminActor("USERS");
  if (!actor)
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const { userId } = await params;
  if (userId === actor.id)
    return NextResponse.json(
      { error: "Vous ne pouvez pas supprimer votre propre compte." },
      { status: 409 },
    );
  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const target = await tx.user.findUnique({
          where: { id: userId },
          select: {
            role: true,
            suspendedAt: true,
            _count: { select: { places: true, events: true } },
          },
        });
        if (!target) return { error: "Compte introuvable", status: 404 };
        if (
          target.role === "ADMIN" &&
          !target.suspendedAt &&
          (await tx.user.count({
            where: { role: "ADMIN", suspendedAt: null },
          })) <= 1
        )
          return {
            error: "Le dernier administrateur actif doit être conservé.",
            status: 409,
          };
        if (target._count.places || target._count.events)
          return {
            error:
              "Ce compte possède des établissements ou événements. Réaffectez-les ou suspendez le compte.",
            status: 409,
          };
        await tx.adminAuditLog.create({
          data: { actorId: actor.id, action: "USER_DELETED", targetId: userId },
        });
        await tx.user.delete({ where: { id: userId } });
        return { success: true };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return "error" in result
      ? NextResponse.json({ error: result.error }, { status: result.status })
      : NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        error: "Suppression impossible : vérifiez les données liées au compte.",
      },
      { status: 409 },
    );
  }
}
