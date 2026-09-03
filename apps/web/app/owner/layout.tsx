import { OwnerSidebar } from "@/features/owner/components/owner-sidebar";

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
      <OwnerSidebar />
      {children}
    </div>
  );
}
