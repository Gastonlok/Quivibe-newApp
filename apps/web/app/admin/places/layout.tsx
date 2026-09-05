import { AdminSection } from "@/features/admin/section";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminSection permission="PLACES">{children}</AdminSection>;
}
