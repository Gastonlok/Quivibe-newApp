import { redirect } from "next/navigation";
import { getAdminActor } from "@/features/admin/access";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await getAdminActor("MESSAGES"))) redirect("/admin/dashboard");
  return children;
}
