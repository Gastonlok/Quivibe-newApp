import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAdmin, hasAdminAccess, type AdminPermission } from "./permissions";

export async function getAdminActor(permission?: AdminPermission) {
  const session = await auth();
  if (!session?.user?.id) return null;
  // Read permissions on every privileged operation, including after revocation.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      role: true,
      moderationPermissions: true,
      suspendedAt: true,
    },
  });
  return (permission ? canAdmin(user, permission) : hasAdminAccess(user))
    ? user
    : null;
}
