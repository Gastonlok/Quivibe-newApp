import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarCheck2,
  Eye,
  MousePointerClick,
  Users,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasOwnerWorkspaceAccess } from "@/features/owner/access";
import { pilotMetrics, pilotPeriod } from "@/features/owner/pilot-metrics";
import { kinshasaDay } from "@/features/reservations/domain";

export const dynamic = "force-dynamic";
const percent = (value: number | null) =>
  value === null ? "—" : `${value.toFixed(1)} %`;

export default async function OwnerAnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/owner/analytics");
  if (!(await hasOwnerWorkspaceAccess(session.user.id, session.user.role)))
    redirect("/");
  const ownerFilter =
    session.user.role === "ADMIN"
      ? {}
      : {
          OR: [
            { ownerId: session.user.id },
            { collaborators: { some: { userId: session.user.id } } },
          ],
        };
  const { start, end } = pilotPeriod();
  const week = pilotPeriod(end, 7);
  const [places, visits, reservations, interactions, favorites, activity] =
    await Promise.all([
      prisma.place.findMany({
        where: ownerFilter,
        select: {
          id: true,
          name: true,
          status: true,
          reservationsEnabled: true,
          commercialStatus: true,
        },
        orderBy: { name: "asc" },
      }),
      prisma.placeVisit.findMany({
        where: { place: ownerFilter, visitedAt: { gte: start, lte: end } },
        select: {
          id: true,
          placeId: true,
          visitorKey: true,
          visitedAt: true,
          channel: true,
        },
      }),
      prisma.reservation.findMany({
        where: {
          place: ownerFilter,
          OR: [
            { createdAt: { gte: start, lte: end } },
            { dateTime: { gte: start, lte: end } },
          ],
        },
        select: {
          placeId: true,
          createdAt: true,
          dateTime: true,
          status: true,
          partySize: true,
          attributedVisitId: true,
        },
      }),
      prisma.placeInteraction.groupBy({
        by: ["type"],
        where: { place: ownerFilter, createdAt: { gte: start, lte: end } },
        _count: true,
      }),
      prisma.favorite.count({ where: { place: ownerFilter } }),
      prisma.reservationStatusEvent.findMany({
        where: {
          reservation: { place: ownerFilter },
          createdAt: { gte: week.start, lte: end },
          actorRole: { in: ["OWNER", "MANAGER", "EDITOR"] },
        },
        select: { reservation: { select: { placeId: true } } },
      }),
    ]);
  const metrics = pilotMetrics(visits, reservations, start, end);
  const eligible = places.filter(
    (p) =>
      p.status === "APPROVED" &&
      p.reservationsEnabled &&
      p.commercialStatus === "PILOT",
  );
  const active = new Set(activity.map((event) => event.reservation.placeId));
  const activeCount = eligible.filter((place) => active.has(place.id)).length;
  const byPlace = places.map((place) => ({
    ...place,
    metrics: pilotMetrics(
      visits.filter((v) => v.placeId === place.id),
      reservations.filter((r) => r.placeId === place.id),
      start,
      end,
    ),
    week: pilotMetrics(
      [],
      reservations.filter((r) => r.placeId === place.id),
      week.start,
      end,
    ),
  }));
  const chartDays = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(end.getTime() - (13 - index) * 24 * 60 * 60_000),
      key = kinshasaDay(date);
    return {
      date,
      key,
      value: visits.filter((v) => kinshasaDay(v.visitedAt) === key).length,
    };
  });
  const chartMax = Math.max(1, ...chartDays.map((day) => day.value));
  const shortDay = (date: Date) =>
    new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Africa/Kinshasa",
      day: "2-digit",
      month: "2-digit",
    }).format(date);
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container py-10">
        <div className="rounded-3xl border border-primary-100 bg-white px-6 py-8 shadow-soft sm:px-8">
          <Link
            href="/owner/dashboard"
            className="inline-flex items-center gap-2 text-sm font-bold text-primary-700"
          >
            <ArrowLeft className="h-4 w-4" /> Espace professionnel
          </Link>
          <p className="mt-6 text-xs font-extrabold uppercase tracking-widest text-primary-700">
            Pilote gratuit · sans commission
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-950">
            La valeur apportée par Quivibe
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            Du {shortDay(start)} au {shortDay(end)}, heure de Kinshasa.
            Aujourd’hui est inclus jusqu’à maintenant.
          </p>
        </div>
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={CalendarCheck2}
            label="Réservations réalisées"
            value={metrics.completed}
            detail={`${metrics.completedGuests} personnes accueillies, selon les déclarations du restaurant`}
          />
          <MetricCard
            icon={CalendarCheck2}
            label="Demandes reçues"
            value={metrics.created}
            detail="Réservations créées pendant ces 30 jours, tous statuts"
          />
          <MetricCard
            icon={MousePointerClick}
            label="Visiteurs ayant réservé"
            value={percent(metrics.conversion)}
            detail={`${metrics.converters} sur ${metrics.trackedVisitors} visiteurs avec suivi de réservation`}
          />
          <MetricCard
            icon={Users}
            label="Restaurants ayant traité une réservation"
            value={`${activeCount} / ${eligible.length}`}
            detail="Sur 7 jours, parmi les restaurants du pilote publiés et ouverts aux réservations"
          />
          <MetricCard
            icon={Eye}
            label="Visites de fiche"
            value={metrics.visits}
            detail={`${metrics.visitors} navigateurs distincts ; visites espacées d’au moins 30 minutes`}
          />
          <MetricCard
            icon={Users}
            label="Favoris actuels"
            value={favorites}
            detail="Utilisateurs ayant actuellement enregistré vos établissements"
          />
        </section>
        <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-extrabold text-gray-950">
            Résultat des réservations arrivées à échéance
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {metrics.due} réservations prévues entre le {shortDay(start)} et
            maintenant, quelle que soit leur date de création.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <p className="rounded-2xl bg-gray-50 p-4">
              <strong>
                {metrics.cancelled} annulations ·{" "}
                {percent(metrics.cancellationRate)}
              </strong>
              <span className="mt-1 block text-xs text-gray-500">
                Part de toutes les réservations arrivées à échéance
              </span>
            </p>
            <p className="rounded-2xl bg-gray-50 p-4">
              <strong>
                {metrics.noShow} absences · {percent(metrics.noShowRate)}
              </strong>
              <span className="mt-1 block text-xs text-gray-500">
                Part des réservations réalisées ou déclarées non honorées
              </span>
            </p>
            <p className="rounded-2xl bg-amber-50 p-4">
              <strong>{metrics.unresolved} résultats à renseigner</strong>
              <span className="mt-1 block text-xs text-gray-600">
                Encore en attente ou confirmées après l’heure prévue
              </span>
            </p>
          </div>
          <Link
            href="/owner/reservations"
            className="mt-5 inline-block text-sm font-extrabold text-primary-700 hover:underline"
          >
            Mettre à jour les réservations
          </Link>
        </section>
        <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-extrabold text-gray-950">
            Visites quotidiennes
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {chartDays.reduce((sum, day) => sum + day.value, 0)} visites sur les
            14 derniers jours, heure de Kinshasa.
          </p>
          <div className="mt-6 overflow-x-auto">
            <div className="flex h-52 min-w-[500px] items-end gap-3">
              {chartDays.map((day) => (
                <div
                  key={day.key}
                  className="flex min-w-0 flex-1 flex-col items-center gap-2"
                >
                  <span className="text-xs font-bold text-gray-700">
                    {day.value}
                  </span>
                  <div className="flex h-36 w-full items-end rounded-t-xl bg-primary-50">
                    <div
                      className="w-full rounded-t-xl bg-primary-600"
                      style={{ height: `${(day.value / chartMax) * 100}%` }}
                      aria-label={`${day.value} visites le ${shortDay(day.date)}`}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500">
                    {shortDay(day.date)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-extrabold text-gray-950">
            Performance par établissement
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Les demandes sont comptées à leur création ; les réservations réalisées,
            à la date de réservation.
          </p>
          {!places.length ? (
            <p className="mt-6 text-gray-600">
              Ajoutez un établissement pour commencer le suivi.
            </p>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b text-xs uppercase text-gray-500">
                  <tr>
                    {[
                      "Établissement",
                      "Visites / 30 j",
                      "Demandes / 30 j",
                      "Réalisées / 30 j",
                      "Réalisées / 7 j",
                      "Conversion",
                    ].map((title) => (
                      <th key={title} className="whitespace-nowrap px-3 py-3">
                        {title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {byPlace.map((place) => (
                    <tr key={place.id} className="border-b border-gray-100">
                      <td className="px-3 py-4 font-bold">
                        <Link
                          href={`/owner/places/${place.id}/edit`}
                          className="text-primary-700"
                        >
                          {place.name}
                        </Link>
                      </td>
                      <td className="px-3">{place.metrics.visits}</td>
                      <td className="px-3">{place.metrics.created}</td>
                      <td className="px-3">{place.metrics.completed}</td>
                      <td className="px-3">{place.week.completed}</td>
                      <td className="px-3">
                        {percent(place.metrics.conversion)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <details className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
          <summary className="cursor-pointer font-bold text-gray-900">
            Comprendre les indicateurs et leur couverture
          </summary>
          <div className="mt-3 space-y-3">
            <p>
              La conversion relie une visite de fiche à une réservation créée
              ensuite, dans les 30 minutes, pour le même établissement. Un
              navigateur compte une fois, même s’il réserve plusieurs fois. Une
              réservation annulée reste une demande générée.
            </p>
            <p>
              {metrics.trackedVisits} visites sur {metrics.visits} disposent du
              nouveau suivi. Les visites anciennes sans ce suivi sont exclues du
              calcul de conversion. {metrics.unattributed} demandes créées
              pendant la période ne sont reliées à aucune visite. Un tiret
              signifie qu’aucun taux ne peut encore être calculé.
            </p>
            <p>
              Les identifiants de navigateur sont pseudonymes : un changement
              d’appareil ou la suppression des cookies crée un autre visiteur.
              Les visites des administrateurs et de l’équipe de l’établissement
              sont exclues depuis l’activation de ce suivi.
            </p>
            <p>
              Les résultats sont déclarés par le restaurant. Les changements
              effectués par l’administration ne comptent pas comme activité du
              restaurant. Les réservations futures sont exclues des résultats
              réalisés, annulations et absences.
            </p>
            <p>
              Actions suivies sur 30 jours (une par navigateur, établissement et
              type toutes les 30 minutes) :{" "}
              {interactions.find((i) => i.type === "RESERVATION_START")
                ?._count || 0}{" "}
              tentatives de réservation,{" "}
              {interactions.find((i) => i.type === "DIRECTIONS")?._count || 0}{" "}
              itinéraires,{" "}
              {interactions.find((i) => i.type === "FAVORITE")?._count || 0}{" "}
              ajouts aux favoris. Les données antérieures à l’activation
              n’étaient pas dédoublonnées.
            </p>
          </div>
        </details>
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
      <Icon className="h-6 w-6 text-primary-600" />
      <p className="mt-4 text-3xl font-extrabold text-gray-950">{value}</p>
      <p className="mt-1 text-sm font-extrabold text-gray-700">{label}</p>
      <p className="mt-2 text-xs text-gray-500">{detail}</p>
    </article>
  );
}
