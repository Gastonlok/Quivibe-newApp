import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminActor } from "@/features/admin/access";
import { canAdmin, type AdminPermission } from "@/features/admin/permissions";

export const dynamic = "force-dynamic";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getAdminActor();
  if (!actor) redirect("/");
  const links: { href: string; label: string; permission?: AdminPermission }[] =
    [
      { href: "/admin/dashboard", label: "Vue d’ensemble" },
      {
        href: "/admin/users",
        label: "Comptes et collaborateurs",
        permission: "USERS",
      },
      { href: "/admin/places", label: "Établissements", permission: "PLACES" },
      {
        href: "/admin/reviews",
        label: "Avis et signalements",
        permission: "REVIEWS",
      },
      { href: "/admin/events", label: "Événements", permission: "EVENTS" },
      {
        href: "/admin/owner-requests",
        label: "Demandes propriétaires",
        permission: "OWNER_REQUESTS",
      },
      {
        href: "/admin/categories",
        label: "Catégories",
        permission: "CATEGORIES",
      },
      {
        href: "/owner/reservations",
        label: "Toutes les réservations",
        permission: "USERS",
      },
      { href: "/owner/analytics", label: "Statistiques", permission: "USERS" },
      {
        href: "/admin/messages",
        label: "Envoyer des messages",
        permission: "MESSAGES",
      },
      {
        href: "/admin/audit",
        label: "Journal d’administration",
        permission: "AUDIT",
      },
    ];
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-gray-950 text-white">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-5">
          <Link
            href="/admin/dashboard"
            className="text-xl font-extrabold text-primary-300"
          >
            Quivibe Administration
          </Link>
          <span>
            {actor.name} ·{" "}
            {actor.role === "ADMIN" ? "Administrateur" : "Collaborateur"}
          </span>
          <Link href="/" className="text-sm">
            Retour à Quivibe
          </Link>
        </div>
      </header>
      <div className="container grid gap-6 py-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav
          aria-label="Administration"
          className="flex flex-wrap content-start gap-2 rounded-2xl border bg-white p-4 lg:flex-col"
        >
          {links
            .filter(
              (link) => !link.permission || canAdmin(actor, link.permission),
            )
            .map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-primary-50 hover:text-primary-700"
              >
                {link.label}
              </Link>
            ))}
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
