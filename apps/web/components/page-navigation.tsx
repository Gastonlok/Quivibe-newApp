"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, House } from "lucide-react";

export function PageNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/") return null;

  return (
    <nav className="border-b border-primary-100 bg-primary-50" aria-label="Navigation de page">
      <div className="container flex items-center justify-between gap-3 py-2">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
              return;
            }

            router.push("/");
          }}
          className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-extrabold text-primary-800 transition hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Retour
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-extrabold text-primary-800 shadow-sm transition hover:bg-primary-100"
        >
          <House className="h-4 w-4" aria-hidden="true" />
          Accueil
        </Link>
      </div>
    </nav>
  );
}
