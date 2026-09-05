import { prisma } from "@/lib/prisma";
import { serializable } from "@/features/reservations/service";

export const VISITOR_COOKIE = "qv_visitor";
export const VISIT_COOLDOWN_MS = 30 * 60_000;
export const isVisitorKey = (value?: string): value is string =>
  Boolean(
    value &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    ),
  );
export function visitChannel(value: unknown) {
  return typeof value === "string" && ["SEARCH", "MAP", "AI"].includes(value)
    ? value
    : "DIRECT";
}

export async function publicPlaceForTracking(
  placeId: string,
  user?: { id: string; role: string },
) {
  if (user?.role === "ADMIN") return null;
  return prisma.place.findFirst({
    where: {
      id: placeId,
      status: "APPROVED",
      ...(user
        ? {
            ownerId: { not: user.id },
            collaborators: { none: { userId: user.id } },
          }
        : {}),
    },
    select: { id: true },
  });
}

export async function recordVisit(
  placeId: string,
  visitorKey: string,
  channel: string,
) {
  return serializable(prisma, async (tx) => {
    const recent = await tx.placeVisit.findFirst({
      where: {
        placeId,
        visitorKey,
        channel: { not: "UNKNOWN" },
        visitedAt: { gte: new Date(Date.now() - VISIT_COOLDOWN_MS) },
      },
      orderBy: { visitedAt: "desc" },
      select: { id: true },
    });
    if (recent) return { tracked: false, visitId: recent.id };
    const visit = await tx.placeVisit.create({
      data: { placeId, visitorKey, channel },
      select: { id: true },
    });
    return { tracked: true, visitId: visit.id };
  });
}

export async function recordInteraction(
  placeId: string,
  visitorKey: string,
  type: string,
) {
  return serializable(prisma, async (tx) => {
    const recent = await tx.placeInteraction.findFirst({
      where: {
        placeId,
        visitorKey,
        type,
        createdAt: { gte: new Date(Date.now() - VISIT_COOLDOWN_MS) },
      },
      select: { id: true },
    });
    if (recent) return false;
    await tx.placeInteraction.create({ data: { placeId, visitorKey, type } });
    return true;
  });
}
