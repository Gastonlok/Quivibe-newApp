// apps/web/app/discover/page.tsx
import { Suspense } from "react";
import DiscoverContent from "./discover-content";

export default function DiscoverPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    }>
      <DiscoverContent />
    </Suspense>
  );
}
