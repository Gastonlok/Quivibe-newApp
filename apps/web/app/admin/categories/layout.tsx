import { AdminSection } from "@/features/admin/section";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminSection permission="CATEGORIES">{children}</AdminSection>;
}
