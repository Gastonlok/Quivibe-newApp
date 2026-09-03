import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BarChart3,
  CalendarCheck2,
  Eye,
  Heart,
  MapPin,
  MessageSquare,
  Plus,
  Star,
  Store,
  Settings2,
  Users,
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

  const [places, upcomingReservations, recentReviews] = await Promise.all([
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
            favorites: true,
            events: true,
            visits: true,
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
      take: 6,
    }),
    prisma.review.findMany({
      where: {
        status: "APPROVED",
        ...(session.user.role === "ADMIN"
          ? {}
          : { place: ownerFilter }),
      },
      include: {
        author: { select: { name: true } },
        place: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const ratings = places.flatMap((place) => place.reviews.map((review) => review.rating));
  const averageRating =
    ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      : null;
  const totalReservations = places.reduce(
    (sum, place) => sum + place._count.reservations,
    0,
  );
  const totalFavorites = places.reduce(
    (sum, place) => sum + place._count.favorites,
    0,
  );
  const totalVisits = places.reduce((sum, place) => sum + place._count.visits, 0);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-primary-700">
              Espace professionnel
            </p>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-gray-950">
              Tableau de bord
            </h1>
            <p className="mt-2 text-gray-600">
              Bienvenue {session.user.name}. Suivez vos établissements et vos réservations.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/owner/analytics"
              className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-5 py-3 text-sm font-extrabold text-primary-800 hover:border-primary-600"
            >
              <BarChart3 className="h-4 w-4" />
              Statistiques
            </Link>
            <Link
              href="/owner/reservations"
              className="rounded-full border border-gray-300 bg-white px-5 py-3 text-sm font-extrabold text-gray-800 hover:border-primary-600 hover:text-primary-700"
            >
              Gérer les réservations
            </Link>
            <Link
              href="/places/new"
              className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              Ajouter un établissement
            </Link>
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard icon={Store} label="Établissements" value={places.length} />
          <StatCard icon={CalendarCheck2} label="Réservations" value={totalReservations} />
          <StatCard
            icon={Star}
            label="Note moyenne"
            value={averageRating === null ? "—" : averageRating.toFixed(1)}
          />
          <StatCard icon={Heart} label="Ajouts aux favoris" value={totalFavorites} />
          <StatCard icon={Eye} label="Visites de fiche" value={totalVisits} />
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
              const placeRating =
                place.reviews.length > 0
                  ? place.reviews.reduce((sum, review) => sum + review.rating, 0) /
                    place.reviews.length
                  : null;
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

                  <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
                    <MiniStat label="Réservations" value={place._count.reservations} />
                    <MiniStat label="Favoris" value={place._count.favorites} />
                    <MiniStat label="Événements" value={place._count.events} />
                    <MiniStat
                      label="Note"
                      value={placeRating === null ? "—" : placeRating.toFixed(1)}
                    />
                    <MiniStat label="Visites" value={place._count.visits} />
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
                    <Link
                      href="/owner/analytics"
                      className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2.5 text-sm font-extrabold text-gray-700 transition hover:border-primary-600 hover:text-primary-700"
                    >
                      <BarChart3 className="h-4 w-4" /> Statistiques
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <section className="mt-8 grid gap-6 xl:grid-cols-2">
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

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-primary-600" />
              <h2 className="text-xl font-extrabold text-gray-950">Derniers avis</h2>
            </div>
            <div className="mt-5 space-y-3">
              {recentReviews.length === 0 ? (
                <p className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
                  Aucun avis publié pour le moment.
                </p>
              ) : (
                recentReviews.map((review) => (
                  <article key={review.id} className="rounded-2xl bg-gray-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-extrabold text-gray-900">
                        {review.author.name} · {review.place.name}
                      </p>
                      <span className="flex items-center gap-1 text-sm font-extrabold text-gray-800">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        {review.rating}/5
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      {review.comment}
                    </p>
                  </article>
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

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-gray-50 p-3 text-center">
      <p className="text-lg font-extrabold text-gray-950">{value}</p>
      <p className="mt-1 text-xs font-bold text-gray-500">{label}</p>
    </div>
  );
}
