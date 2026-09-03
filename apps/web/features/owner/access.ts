import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type PlaceAccess = "OWNER" | "MANAGER" | "EDITOR" | "ADMIN";

export async function getPlaceAccess(placeId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (session.user.role === "ADMIN") return "ADMIN" as const;

  const place = await prisma.place.findFirst({
    where: {
      id: placeId,
      OR: [
        { ownerId: session.user.id },
        { collaborators: { some: { userId: session.user.id } } },
      ],
    },
    select: {
      ownerId: true,
      collaborators: { where: { userId: session.user.id }, select: { role: true }, take: 1 },
    },
  });

  if (!place) return null;
  if (place.ownerId === session.user.id) return "OWNER" as const;
  return (place.collaborators[0]?.role as PlaceAccess | undefined) || null;
}

export function canManageCollaborators(access: PlaceAccess | null) {
  return access === "OWNER" || access === "ADMIN" || access === "MANAGER";
}

export async function hasOwnerWorkspaceAccess(userId: string, role: string) {
  if (["OWNER", "ADMIN"].includes(role)) return true;
  return Boolean(await prisma.placeCollaborator.findFirst({ where: { userId }, select: { id: true } }));
}
