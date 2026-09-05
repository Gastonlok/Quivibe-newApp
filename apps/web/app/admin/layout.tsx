import { redirect } from "next/navigation";
import { getAdminActor } from "@/features/admin/access";
import { AdminSidebar } from "@/features/admin/admin-sidebar";

export const dynamic = "force-dynamic";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getAdminActor();
  if (!actor) redirect("/");

  return (
    <div className="min-h-screen bg-gray-50 lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
      <AdminSidebar
        user={{
          name: actor.name,
          role: actor.role,
          moderationPermissions: actor.moderationPermissions,
        }}
      />
      <div className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</div>
    </div>
  );
}
