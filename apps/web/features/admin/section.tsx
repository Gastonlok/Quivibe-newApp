import { redirect } from "next/navigation";
import { getAdminActor } from "./access";
import type { AdminPermission } from "./permissions";

export async function AdminSection({
  permission,
  children,
}: {
  permission: AdminPermission;
  children: React.ReactNode;
}) {
  if (!(await getAdminActor(permission))) redirect("/admin/dashboard");
  return children;
}
