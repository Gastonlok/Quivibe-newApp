import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminActor } from "@/features/admin/access";
import { slugify } from "@/utils/slugify";
const schema = z
  .object({
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(2000).default(""),
    address: z.string().trim().min(3).max(200),
    neighborhood: z.string().trim().min(2).max(100),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    priceRange: z.coerce.number().int().min(1).max(4),
    phone: z.string().trim().max(30).optional(),
    ownerId: z.string().max(100).optional(),
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).default("APPROVED"),
  })
  .strict();
export async function POST(request: Request) {
  const actor = await getAdminActor("USERS");
  if (!actor)
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !slugify(parsed.data.name))
    return NextResponse.json(
      { error: "Vérifiez les informations de l’établissement." },
      { status: 400 },
    );
  try {
    const place = await prisma.$transaction(async (tx) => {
      const ownerId = parsed.data.ownerId || actor.id;
      const owner = await tx.user.findFirst({
        where: {
          id: ownerId,
          suspendedAt: null,
          role: { in: ["OWNER", "ADMIN"] },
        },
        select: { id: true },
      });
      if (!owner) throw new Error("Invalid owner");
      const base = slugify(parsed.data.name);
      const slug = (await tx.place.findUnique({
        where: { slug: base },
        select: { id: true },
      }))
        ? `${base}-${randomUUID().slice(0, 8)}`
        : base;
      const result = await tx.place.create({
        data: {
          ...parsed.data,
          slug,
          ownerId,
          phone: parsed.data.phone || null,
        },
      });
      await tx.adminAuditLog.create({
        data: {
          actorId: actor.id,
          action: "PLACE_CREATED",
          targetId: result.id,
          details: { name: result.name, ownerId },
        },
      });
      return result;
    });
    return NextResponse.json({ place }, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        error:
          "Création impossible. Choisissez un compte propriétaire ou administrateur actif.",
      },
      { status: 409 },
    );
  }
}
