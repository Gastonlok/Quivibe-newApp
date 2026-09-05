import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminActor } from "@/features/admin/access";
import { slugify } from "@/utils/slugify";
export async function GET() {
  if (!(await getAdminActor("CATEGORIES")))
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  return NextResponse.json({
    categories: await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { places: true } } },
    }),
  });
}
export async function POST(request: Request) {
  const actor = await getAdminActor("CATEGORIES");
  if (!actor)
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const parsed = z
    .object({
      id: z.string().min(1).optional(),
      name: z.string().trim().min(2).max(80),
    })
    .strict()
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success || !slugify(parsed.data.name))
    return NextResponse.json({ error: "Nom invalide" }, { status: 400 });
  try {
    const category = await prisma.$transaction(async (tx) => {
      const data = { name: parsed.data.name, slug: slugify(parsed.data.name) };
      const result = parsed.data.id
        ? await tx.category.update({ where: { id: parsed.data.id }, data })
        : await tx.category.create({ data });
      await tx.adminAuditLog.create({
        data: {
          actorId: actor.id,
          action: "CATEGORY_SAVED",
          targetId: result.id,
          details: data,
        },
      });
      return result;
    });
    return NextResponse.json({ category });
  } catch {
    return NextResponse.json(
      { error: "Cette catégorie existe déjà ou ne peut pas être modifiée." },
      { status: 409 },
    );
  }
}
export async function DELETE(request: Request) {
  const actor = await getAdminActor("CATEGORIES");
  if (!actor)
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const parsed = z
    .object({ id: z.string().min(1) })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Catégorie invalide" }, { status: 400 });
  try {
    await prisma.$transaction(async (tx) => {
      if (
        await tx.placeCategory.count({ where: { categoryId: parsed.data.id } })
      )
        throw new Error("Category in use");
      await tx.category.delete({ where: { id: parsed.data.id } });
      await tx.adminAuditLog.create({
        data: {
          actorId: actor.id,
          action: "CATEGORY_DELETED",
          targetId: parsed.data.id,
        },
      });
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      {
        error:
          "Retirez cette catégorie des établissements avant de la supprimer.",
      },
      { status: 409 },
    );
  }
}
