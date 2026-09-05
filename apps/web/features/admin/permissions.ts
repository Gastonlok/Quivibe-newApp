export const MODERATION_PERMISSIONS = [
  "PLACES",
  "REVIEWS",
  "EVENTS",
  "OWNER_REQUESTS",
] as const;
export type ModerationPermission = (typeof MODERATION_PERMISSIONS)[number];
export type AdminPermission =
  ModerationPermission | "USERS" | "MESSAGES" | "CATEGORIES" | "AUDIT";
export const permissionLabels: Record<ModerationPermission, string> = {
  PLACES: "Modérer les établissements",
  REVIEWS: "Modérer les avis et signalements",
  EVENTS: "Modérer les événements",
  OWNER_REQUESTS: "Traiter les demandes propriétaires",
};
export function canAdmin(
  user:
    | {
        role: string;
        moderationPermissions?: string[];
        suspendedAt?: Date | string | null;
      }
    | null
    | undefined,
  permission: AdminPermission,
) {
  return Boolean(
    user &&
    !user.suspendedAt &&
    (user.role === "ADMIN" ||
      (MODERATION_PERMISSIONS.includes(permission as ModerationPermission) &&
        user.moderationPermissions?.includes(permission))),
  );
}
export function hasAdminAccess(user: Parameters<typeof canAdmin>[0]) {
  return Boolean(
    user &&
    !user.suspendedAt &&
    (user.role === "ADMIN" ||
      MODERATION_PERMISSIONS.some((permission) => canAdmin(user, permission))),
  );
}
