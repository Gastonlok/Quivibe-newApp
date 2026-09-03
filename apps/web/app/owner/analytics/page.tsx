import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  CalendarCheck2,
  Eye,
  MousePointerClick,
  Users,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasOwnerWorkspaceAccess } from "@/features/owner/access";

export const dynamic = "force-dynamic";

const kinshasaDayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Kinshasa",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function dayKey(date: Date) {
  const parts = kinshasaDayFormatter.formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function shortDay(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Africa/Kinshasa",
    day: "2-digit",
    month: "short",
  }).format(date);
}

export default async function OwnerAnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/owner/analytics");
  if (!(await hasOwnerWorkspaceAccess(session.user.id, session.user.role))) redirect("/");

  const ownerFilter = session.user.role === "ADMIN" ? {} : { OR: [{ ownerId: session.user.id }, { collaborators: { some: { userId: session.user.id } } }] };
  const relationFilter =
    session.user.role === "ADMIN" ? {} : { place: ownerFilter };
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - 29);
  periodStart.setHours(0, 0, 0, 0);

  const [places, visits, reservations, interactions] = await Promise.all([
    prisma.place.findMany({
      where: ownerFilter,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.placeVisit.findMany({
      where: { visitedAt: { gte: periodStart }, ...relationFilter },
      select: { placeId: true, visitorKey: true, visitedAt: true },
    }),
    prisma.reservation.findMany({
      where: { createdAt: { gte: periodStart }, ...relationFilter },
      select: { placeId: true, partySize: true, status: true },
    }),
    prisma.placeInteraction.findMany({
      where: { createdAt: { gte: periodStart }, ...relationFilter },
      select: { placeId: true, type: true },
    }),
  ]);

  const uniqueVisitors = new Set(visits.map((visit) => visit.visitorKey)).size;
  const totalGuests = reservations.reduce((total, reservation) => total + reservation.partySize, 0);
  const confirmedReservations = reservations.filter((reservation) =>
    ["CONFIRMED", "COMPLETED"].includes(reservation.status),
  ).length;
  const conversionRate = uniqueVisitors ? (reservations.length / uniqueVisitors) * 100 : 0;
  const directions = interactions.filter((interaction) => interaction.type === "DIRECTIONS").length;
  const favorites = interactions.filter((interaction) => interaction.type === "FAVORITE").length;
  const reservationStarts = interactions.filter((interaction) => interaction.type === "RESERVATION_START").length;

  const visitCountByPlace = new Map<string, number>();
  const reservationCountByPlace = new Map<string, number>();
  for (const visit of visits) {
    visitCountByPlace.set(visit.placeId, (visitCountByPlace.get(visit.placeId) || 0) + 1);
  }
  for (const reservation of reservations) {
    reservationCountByPlace.set(
      reservation.placeId,
      (reservationCountByPlace.get(reservation.placeId) || 0) + 1,
    );
  }

  const dailyVisits = new Map<string, number>();
  for (const visit of visits) {
    const key = dayKey(visit.visitedAt);
    dailyVisits.set(key, (dailyVisits.get(key) || 0) + 1);
  }
  const chartDays = Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - index));
    return { date, key: dayKey(date), value: 0 };
  }).map((day) => ({ ...day, value: dailyVisits.get(day.key) || 0 }));
  const chartMaximum = Math.max(1, ...chartDays.map((day) => day.value));

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container py-10">
        <div className="rounded-3xl bg-gray-950 px-6 py-8 text-white shadow-medium sm:px-8">
          <Link
            href="/owner/dashboard"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-300 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Retour a l&apos;espace pro
          </Link>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary-300">
                Pilotage de l&apos;activite
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Statistiques des 30 derniers jours
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-300">
                Visites anonymisees, demandes de reservation et performance par etablissement.
              </p>
            </div>
            <BarChart3 className="h-12 w-12 text-primary-300" />
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={Eye} label="Visites de fiche" value={visits.length} detail="pages publiques consultees" />
          <MetricCard icon={Users} label="Visiteurs uniques" value={uniqueVisitors} detail="identifiants anonymes" />
          <MetricCard
            icon={CalendarCheck2}
            label="Reservations creees"
            value={reservations.length}
            detail={`${confirmedReservations} confirmees ou realisees`}
          />
          <MetricCard
            icon={MousePointerClick}
            label="Conversion"
            value={`${conversionRate.toFixed(1)}%`}
            detail={`${totalGuests} couverts reserves`}
          />
          <MetricCard icon={MousePointerClick} label="Actions d'intention" value={interactions.length} detail={`${reservationStarts} reservations, ${directions} itineraires, ${favorites} favoris`} />
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-gray-950">Visites quotidiennes</h2>
                <p className="mt-1 text-sm text-gray-600">Les 14 derniers jours, heure de Kinshasa.</p>
              </div>
              <span className="text-sm font-extrabold text-primary-700">{visits.length} au total</span>
            </div>
            <div className="mt-8 flex h-52 items-end gap-2 sm:gap-3">
              {chartDays.map((day) => (
                <div key={day.key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <span className="text-xs font-extrabold text-gray-700">{day.value || ""}</span>
                  <div className="flex h-36 w-full items-end rounded-t-xl bg-primary-50">
                    <div
                      className="w-full rounded-t-xl bg-primary-600 transition-all"
                      style={{ height: `${Math.max(day.value ? 10 : 2, (day.value / chartMaximum) * 100)}%` }}
                      aria-label={`${day.value} visites le ${shortDay(day.date)}`}
                    />
                  </div>
                  <span className="whitespace-nowrap text-[10px] font-bold text-gray-500 sm:text-xs">
                    {shortDay(day.date)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
            <h2 className="text-xl font-extrabold text-gray-950">Etat des reservations</h2>
            <div className="mt-5 space-y-3">
              {[
                ["En attente", "PENDING"],
                ["Confirmees", "CONFIRMED"],
                ["Realisees", "COMPLETED"],
                ["Annulees", "CANCELLED"],
                ["Absences", "NO_SHOW"],
              ].map(([label, status]) => {
                const value = reservations.filter((reservation) => reservation.status === status).length;
                return (
                  <div key={status} className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
                    <span className="text-sm font-bold text-gray-700">{label}</span>
                    <span className="text-lg font-extrabold text-gray-950">{value}</span>
                  </div>
                );
              })}
            </div>
            <Link href="/owner/reservations" className="mt-5 inline-flex text-sm font-extrabold text-primary-700 hover:underline">
              Gerer les reservations
            </Link>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-gray-950">Performance par etablissement</h2>
              <p className="mt-1 text-sm text-gray-600">Comparez l&apos;interet genere par chacune de vos fiches.</p>
            </div>
            <span className="text-sm font-bold text-gray-500">Periode glissante de 30 jours</span>
          </div>
          {places.length === 0 ? (
            <p className="mt-6 rounded-2xl bg-gray-50 p-5 text-sm text-gray-600">
              Ajoutez un etablissement pour commencer a suivre son activite.
            </p>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="pb-3 pr-5 font-extrabold">Etablissement</th>
                    <th className="pb-3 pr-5 text-right font-extrabold">Visites</th>
                    <th className="pb-3 pr-5 text-right font-extrabold">Reservations</th>
                    <th className="pb-3 text-right font-extrabold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {places.map((place) => (
                    <tr key={place.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-4 pr-5 font-extrabold text-gray-900">{place.name}</td>
                      <td className="py-4 pr-5 text-right text-sm font-bold text-gray-700">
                        {visitCountByPlace.get(place.id) || 0}
                      </td>
                      <td className="py-4 pr-5 text-right text-sm font-bold text-gray-700">
                        {reservationCountByPlace.get(place.id) || 0}
                      </td>
                      <td className="py-4 text-right">
                        <Link href={`/owner/places/${place.id}/edit`} className="text-sm font-extrabold text-primary-700 hover:underline">
                          Gerer
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-soft">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-5 text-3xl font-extrabold tracking-tight text-gray-950">{value}</p>
      <p className="mt-1 text-sm font-extrabold text-gray-700">{label}</p>
      <p className="mt-1 text-xs font-semibold text-gray-500">{detail}</p>
    </article>
  );
}
