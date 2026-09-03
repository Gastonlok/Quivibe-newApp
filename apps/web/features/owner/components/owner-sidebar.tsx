"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarCheck2, LayoutDashboard, Plus, Store } from "lucide-react";

const items = [
  { href: "/owner/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/owner/analytics", label: "Statistiques", icon: BarChart3 },
  { href: "/owner/reservations", label: "Reservations", icon: CalendarCheck2 },
];

export function OwnerSidebar() {
  const pathname = usePathname();
  return <aside className="border-b border-gray-200 bg-white lg:sticky lg:top-[4.5rem] lg:h-[calc(100vh-4.5rem)] lg:self-start lg:border-b-0 lg:border-r">
    <div className="flex h-full flex-col p-4 lg:p-6">
      <Link href="/owner/dashboard" className="flex items-center gap-3 px-2 py-2 text-gray-950"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-600 text-white"><Store className="h-5 w-5" /></span><span><span className="block text-lg font-extrabold">Quivibe Pro</span><span className="block text-xs font-bold text-gray-500">Espace proprietaire</span></span></Link>
      <nav className="mt-5 flex gap-2 overflow-x-auto lg:flex-col">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href === "/owner/dashboard" && pathname.startsWith("/owner/places"));
          return <Link key={href} href={href} className={`inline-flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${active ? "bg-primary-600 text-white shadow-soft" : "text-gray-600 hover:bg-gray-100 hover:text-gray-950"}`}><Icon className="h-5 w-5" />{label}</Link>;
        })}
      </nav>
      <Link href="/places/new" className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-gray-800"><Plus className="h-4 w-4" />Ajouter un etablissement</Link>
      <p className="mt-auto hidden px-2 pt-8 text-xs leading-5 text-gray-500 lg:block">Pilotez vos fiches, reservations et performances depuis un seul espace.</p>
    </div>
  </aside>;
}
