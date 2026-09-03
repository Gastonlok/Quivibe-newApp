import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  CalendarCheck2,
  MessageSquare,
  Shield,
  Store,
  Users,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/");

  const [
    totalUsers,
    totalPlaces,
    totalReviews,
    totalReservations,
    pendingPlaces,
    pendingReviews,
    pendingOwnerRequests,
    confirmedReservations,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.place.count(),
    prisma.review.count(),
    prisma.reservation.count(),
    prisma.place.count({ where: { status: "PENDING" } }),
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.ownerRequest.count({ where: { status: "PENDING" } }),
    prisma.reservation.count({ where: { status: "CONFIRMED" } }),
  ]);

  const cards = [
    {
      label: "Utilisateurs",
      value: totalUsers,
      detail: "comptes enregistrés",
      icon: Users,
      href: "/admin/users",
    },
    {
      label: "Établissements",
      value: totalPlaces,
      detail: `${pendingPlaces} en attente`,
      icon: Store,
      href: "/admin/places",
    },
    {
      label: "Avis",
      value: totalReviews,
      detail: `${pendingReviews} à modérer`,
      icon: MessageSquare,
      href: "/admin/reviews",
    },
    {
      label: "Réservations",
      value: totalReservations,
      detail: `${confirmedReservations} confirmées`,
      icon: CalendarCheck2,
      href: "/owner/reservations",
    },
  ];

  return (
    <main>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-primary-700">
            Pilotage
          </p>
          <h1 className="mt-2 flex items-center gap-3 text-3xl font-extrabold tracking-tight text-gray-950">
            <Shield className="h-7 w-7 text-primary-600" />
            Administration Quivibe
          </h1>
          <p className="mt-2 text-gray-600">
            Indicateurs calculés directement à partir de la base de données.
          </p>
        </div>
        <span className="rounded-full bg-primary-50 px-4 py-2 text-sm font-extrabold text-primary-700">
          Plateforme active
        </span>
      </div>

      {(pendingPlaces > 0 || pendingReviews > 0 || pendingOwnerRequests > 0) && (
        <section className="mb-7 rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <h2 className="font-extrabold text-amber-900">Actions requises</h2>
              <p className="mt-1 text-sm leading-6 text-amber-800">
                {pendingPlaces} établissement{pendingPlaces > 1 ? "s" : ""}, {pendingReviews} avis et {pendingOwnerRequests} demande{pendingOwnerRequests > 1 ? "s" : ""} propriétaire en attente.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, detail, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="rounded-3xl border border-gray-200 bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:border-primary-200 hover:shadow-medium"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-5 text-3xl font-extrabold tracking-tight text-gray-950">
              {value.toLocaleString("fr-FR")}
            </p>
            <p className="mt-1 font-extrabold text-gray-800">{label}</p>
            <p className="mt-1 text-sm text-gray-500">{detail}</p>
          </Link>
        ))}
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <QuickLink
          href="/admin/owner-requests"
          title="Demandes propriétaires"
          count={pendingOwnerRequests}
          icon={Store}
        />
        <QuickLink
          href="/admin/places"
          title="Établissements à valider"
          count={pendingPlaces}
          icon={AlertTriangle}
        />
        <QuickLink
          href="/admin/reviews"
          title="Avis à modérer"
          count={pendingReviews}
          icon={MessageSquare}
        />
      </section>
    </main>
  );
}

function QuickLink({
  href,
  title,
  count,
  icon: Icon,
}: {
  href: string;
  title: string;
  count: number;
  icon: React.ElementType;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-3xl border border-gray-200 bg-white p-5 shadow-soft hover:border-primary-300"
    >
      <span className="flex items-center gap-3 font-extrabold text-gray-900">
        <Icon className="h-5 w-5 text-primary-600" />
        {title}
      </span>
      <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-extrabold text-primary-700">
        {count}
      </span>
    </Link>
  );
}
