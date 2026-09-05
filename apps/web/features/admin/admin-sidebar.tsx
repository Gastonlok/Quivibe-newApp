"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  CalendarCheck2,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  MessageSquare,
  Send,
  Shield,
  Store,
  Tags,
  UserCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { canAdmin, type AdminPermission } from "./permissions";

const items: {
  href: string;
  label: string;
  icon: LucideIcon;
  permission?: AdminPermission;
}[] = [
  { href: "/admin/dashboard", label: "Vue d’ensemble", icon: LayoutDashboard },
  {
    href: "/admin/newsletter",
    label: "Newsletter",
    icon: Send,
    permission: "MESSAGES",
  },
  {
    href: "/admin/users",
    label: "Comptes et collaborateurs",
    icon: UsersRound,
    permission: "USERS",
  },
  {
    href: "/admin/places",
    label: "Établissements",
    icon: Store,
    permission: "PLACES",
  },
  {
    href: "/admin/reviews",
    label: "Avis et signalements",
    icon: MessageSquare,
    permission: "REVIEWS",
  },
  {
    href: "/admin/events",
    label: "Événements",
    icon: CalendarDays,
    permission: "EVENTS",
  },
  {
    href: "/admin/owner-requests",
    label: "Demandes propriétaires",
    icon: UserCheck,
    permission: "OWNER_REQUESTS",
  },
  {
    href: "/admin/categories",
    label: "Catégories",
    icon: Tags,
    permission: "CATEGORIES",
  },
  {
    href: "/owner/reservations",
    label: "Toutes les réservations",
    icon: CalendarCheck2,
    permission: "USERS",
  },
  {
    href: "/owner/analytics",
    label: "Statistiques",
    icon: BarChart3,
    permission: "USERS",
  },
  {
    href: "/admin/messages",
    label: "Envoyer des messages",
    icon: Send,
    permission: "MESSAGES",
  },
  {
    href: "/admin/audit",
    label: "Journal d’administration",
    icon: ClipboardList,
    permission: "AUDIT",
  },
];

type SidebarUser = {
  name: string;
  role: string;
  moderationPermissions: string[];
};

export function AdminSidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();

  return (
    <aside className="border-b border-gray-200 bg-white lg:sticky lg:top-[4.5rem] lg:h-[calc(100vh-4.5rem)] lg:self-start lg:overflow-y-auto lg:border-b-0 lg:border-r">
      <div className="flex min-h-full flex-col p-4 lg:p-6">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-3 px-2 py-2 text-gray-950"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-white">
            <Shield className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-lg font-extrabold">Quivibe Admin</span>
            <span className="block text-xs font-bold text-gray-500">
              {user.role === "ADMIN"
                ? "Espace administrateur"
                : "Espace collaborateur"}
            </span>
          </span>
        </Link>

        <nav
          aria-label="Administration"
          className="mt-5 flex gap-2 overflow-x-auto lg:flex-col lg:overflow-x-visible"
        >
          {items
            .filter(
              (item) => !item.permission || canAdmin(user, item.permission),
            )
            .map(({ href, label, icon: Icon }) => {
              const active =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${active ? "bg-primary-600 text-white shadow-soft" : "text-gray-600 hover:bg-gray-100 hover:text-gray-950"}`}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="whitespace-nowrap lg:whitespace-normal">
                    {label}
                  </span>
                </Link>
              );
            })}
        </nav>

        <Link
          href="/"
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à Quivibe
        </Link>
        <div className="mt-auto hidden px-2 pt-8 text-xs leading-5 text-gray-500 lg:block">
          <p className="truncate font-bold text-gray-700">{user.name}</p>
          <p>Gérez les activités et la modération depuis un seul espace.</p>
        </div>
      </div>
    </aside>
  );
}
