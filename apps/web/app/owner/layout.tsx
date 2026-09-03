import { OwnerSidebar } from "@/features/owner/components/owner-sidebar";

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-gray-50 lg:pl-72"><OwnerSidebar />{children}</div>;
}
