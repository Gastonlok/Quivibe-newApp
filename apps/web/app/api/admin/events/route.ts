import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminActor } from "@/features/admin/access";

export async function GET() {
  if (!(await getAdminActor("EVENTS")))
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const events = await prisma.event.findMany({
    orderBy: { startDate: "desc" },
    include: { place: { select: { name: true } } },
  });
  return NextResponse.json({ events });
}
const schema = z
  .object({
    id: z.string().min(1),
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
    title: z.string().trim().min(2).max(160).optional(),
    description: z.string().trim().min(2).max(5000).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().nullable().optional(),
    organizerEmail: z.string().email().optional(),
  })
  .strict();
export async function PATCH(request: Request) {
  const actor = await getAdminActor("EVENTS");
  if (!actor)
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Événement invalide" }, { status: 400 });
  if (
    actor.role !== "ADMIN" &&
    Object.keys(parsed.data).some((key) => !["id", "status"].includes(key))
  )
    return NextResponse.json(
      { error: "Seule la modération vous est confiée." },
      { status: 403 },
    );
  const { id, organizerEmail, ...data } = parsed.data;
  try {
    await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUniqueOrThrow({ where: { id } });
      const start = data.startDate ? new Date(data.startDate) : event.startDate;
      const end =
        data.endDate === undefined
          ? event.endDate
          : data.endDate
            ? new Date(data.endDate)
            : null;
      if (end && end <= start) throw new Error("Invalid dates");
      const organizer = organizerEmail
        ? await tx.user.findFirst({
            where: { email: organizerEmail.toLowerCase(), suspendedAt: null },
            select: { id: true },
          })
        : null;
      if (organizerEmail && !organizer) throw new Error("Unknown organizer");
      await tx.event.update({
        where: { id },
        data: { ...data, ...(organizer ? { organizerId: organizer.id } : {}) },
      });
      await tx.adminAuditLog.create({
        data: {
          actorId: actor.id,
          action: "EVENT_UPDATED",
          targetId: id,
          details: parsed.data,
        },
      });
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Vérifiez les dates et le compte organisateur." },
      { status: 400 },
    );
  }
}
export async function DELETE(request: Request) {
  const actor = await getAdminActor("USERS");
  if (!actor)
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const parsed = z
    .object({ id: z.string().min(1) })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Événement invalide" }, { status: 400 });
  try {
    await prisma.$transaction(async (tx) => {
      await tx.event.delete({ where: { id: parsed.data.id } });
      await tx.adminAuditLog.create({
        data: {
          actorId: actor.id,
          action: "EVENT_DELETED",
          targetId: parsed.data.id,
        },
      });
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Suppression impossible" },
      { status: 409 },
    );
  }
}
