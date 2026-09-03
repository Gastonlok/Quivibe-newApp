import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarCheck2,
  MapPin,
  Star,
  Store,
  Settings2,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasOwnerWorkspaceAccess } from "@/features/owner/access";

export const dynamic = "force-dynamic";

export default async function OwnerDashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/owner/dashboard");
  if (!(await hasOwnerWorkspaceAccess(session.user.id, session.user.role))) redirect("/");

  const ownerFilter =
    session.user.role === "ADMIN"
      ? {}
      : { OR: [{ ownerId: session.user.id }, { collaborators: { some: { userId: session.user.id } } }] };

  const [places, upcomingReservations] = await Promise.all([
    prisma.place.findMany({
      where: ownerFilter,
      include: {
        reviews: {
          where: { status: "APPROVED" },
          select: { rating: true },
        },
        _count: {
          select: {
            reservations: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.reservation.findMany({
      where: {
        dateTime: { gte: new Date() },
        status: { in: ["PENDING", "CONFIRMED"] },
        ...(session.user.role === "ADMIN"
          ? {}
          : { place: ownerFilter }),
      },
      include: {
        customer: { select: { name: true, email: true } },
        place: { select: { name: true } },
      },
      orderBy: { dateTime: "asc" },
      take: 4,
    }),
  ]);

  const ratings = places.flatMap((place) => place.reviews.map((review) => review.rating));
  const averageRating =
    ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      : null;
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container py-10">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-primary-700">
            Espace professionnel
          </p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-gray-950">
            Bonjour {session.user.name}
          </h1>
          <p className="mt-2 text-gray-600">
            Retrouvez l’essentiel de votre activité aujourd’hui.
          </p>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard icon={Store} label="Établissements" value={places.length} />
          <StatCard icon={CalendarCheck2} label="Réservations à venir" value={upcomingReservations.length} />
          <StatCard
            icon={Star}
            label="Note moyenne"
            value={averageRating === null ? "—" : averageRating.toFixed(1)}
          />
        </section>

        {places.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-soft">
            <Store className="mx-auto h-10 w-10 text-primary-600" />
            <h2 className="mt-4 text-xl font-extrabold text-gray-950">
              Aucun établissement rattaché
            </h2>
            <p className="mt-2 text-gray-600">
              Ajoutez votre première fiche ; elle sera publiée après validation administrative.
            </p>
            <Link
              href="/places/new"
              className="mt-6 inline-flex rounded-full bg-primary-600 px-6 py-3 text-sm font-extrabold text-white hover:bg-primary-700"
            >
              Créer ma fiche
            </Link>
          </section>
        ) : (
          <section className="mt-8 grid gap-4 lg:grid-cols-2">
            {places.map((place) => {
              return (
                <article
                  key={place.id}
                  className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-extrabold text-gray-950">
                          {place.name}
                        </h2>
                        <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                          place.status === "APPROVED"
                            ? "bg-primary-50 text-primary-700"
                            : place.status === "REJECTED"
                              ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-800"
                        }`}>
                          {place.status === "APPROVED"
                            ? "Publié"
                            : place.status === "REJECTED"
                              ? "Refusé"
                              : "En validation"}
                        </span>
                      </div>
                      <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-gray-600">
                        <MapPin className="h-4 w-4 text-primary-600" />
                        {place.neighborhood}
                      </p>
                    </div>
                    {place.status === "APPROVED" && (
                      <Link
                        href={`/places/${place.slug}`}
                        className="text-sm font-extrabold text-primary-700 hover:underline"
                      >
                        Voir la fiche
                      </Link>
                    )}
                  </div>

                  <p className="mt-5 text-sm font-semibold text-gray-600">
                    Réservation en ligne : {place.reservationsEnabled ? "activée" : "désactivée"}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href={`/owner/places/${place.id}/edit`}
                      className="inline-flex items-center gap-2 rounded-full bg-gray-950 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-gray-800"
                    >
                      <Settings2 className="h-4 w-4" /> Gérer la fiche
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <section className="mt-8 max-w-3xl">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-extrabold text-gray-950">
                Prochaines réservations
              </h2>
              <Link
                href="/owner/reservations"
                className="text-sm font-extrabold text-primary-700 hover:underline"
              >
                Voir tout
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {upcomingReservations.length === 0 ? (
                <p className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
                  Aucune réservation à venir.
                </p>
              ) : (
                upcomingReservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gray-50 p-4"
                  >
                    <div>
                      <p className="font-extrabold text-gray-900">
                        {reservation.customer.name}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {reservation.place.name} · {reservation.partySize} personne{reservation.partySize > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right text-sm font-bold text-primary-700">
                      {new Intl.DateTimeFormat("fr-FR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Africa/Kinshasa",
                      }).format(reservation.dateTime)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </section>
      </div>
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-soft">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-5 text-3xl font-extrabold tracking-tight text-gray-950">{value}</p>
      <p className="mt-1 text-sm font-bold text-gray-500">{label}</p>
    </div>
  );
}
