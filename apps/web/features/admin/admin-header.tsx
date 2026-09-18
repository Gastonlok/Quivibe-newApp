"use client";

import Link from "next/link";
import { LogOut, Shield } from "lucide-react";
import { signOut } from "next-auth/react";

export function AdminHeader({ name }: { name: string }) {
  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 sm:px-6">
      <Link
        href="/admin/dashboard"
        className="inline-flex items-center gap-2 font-extrabold text-gray-950"
      >
        <Shield className="h-5 w-5 text-primary-600" aria-hidden="true" />
        Quivibe Admin
      </Link>
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href="/profile"
          className="hidden max-w-48 truncate text-sm font-semibold text-gray-700 hover:text-primary-600 sm:block"
        >
          {name}
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-gray-950"
          aria-label="Se déconnecter"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Déconnexion</span>
        </button>
      </div>
    </header>
  );
}
