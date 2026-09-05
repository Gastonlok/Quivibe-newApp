import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Settings2,
  UserX,
  Users,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasOwnerWorkspaceAccess } from "@/features/owner/access";
import { getReservationManager } from "@/features/reservations/manager-service";
import { calendarDate } from "@/features/reservations/schema";
import { kinshasaDay, STATUS_LABELS } from "@/features/reservations/domain";
import { formatReservationPrice } from "@/features/reservations/pricing";
import { OwnerReservationActions } from "@/features/reservations/components/owner-reservation-actions";
import { ReservationHistory } from "@/features/reservations/components/reservation-history";
import {
  ReservationAvailabilityManager,
  ReservationManagerFilters,
} from "@/features/reservations/components/reservation-manager-controls";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function OwnerReservationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/owner/reservations");
  if (!(await hasOwnerWorkspaceAccess(session.user.id, session.user.role)))
    redirect("/");
  const query = await searchParams;
  const dateResult = calendarDate.safeParse(query.date);
  const date = dateResult.success ? dateResult.data : kinshasaDay(new Date());
  const placeId = typeof query.placeId === "string" ? query.placeId : undefined;
  const all = query.view === "all";
  const page =
    typeof query.page === "string" && /^[1-9]\d{0,3}$/.test(query.page)
      ? Math.min(1000, Number(query.page))
      : 1;
  const manager = await getReservationManager(prisma, session.user, {
    date,
    placeId,
    all,
    page,
  });
  if (placeId && !manager.place) notFound();
  if (!manager.place)
    return (
      <main className="container py-10">
        <h1 className="text-3xl font-extrabold">Planning des réservations</h1>
        <p className="mt-4 text-gray-600">
          Ajoutez un établissement pour recevoir vos premières réservations.
        </p>
        <Link
          href="/places/new"
          className="mt-5 inline-block rounded-full bg-primary-600 px-5 py-3 font-bold text-white"
        >
          Créer ma fiche
        </Link>
      </main>
    );
  const { place, places, reservations, availability, summary, hasNext } =
    manager;
  const enabled = place.reservationsEnabled && place.status === "APPROVED";
  function pageHref(next: number) {
    const params = new URLSearchParams({
      date,
      placeId: place!.id,
      page: String(next),
    });
    if (all) params.set("view", "all");
    return `/owner/reservations?${params}`;
  }
  const dayLabel = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeZone: "Africa/Kinshasa",
  }).format(new Date(`${date}T12:00:00Z`));

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-wider text-primary-700">
              Quivibe Restaurant Manager
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-950 sm:text-4xl">
              Planning des réservations
            </h1>
            <p className="mt-3 max-w-2xl text-gray-600">
              Préparez votre service, gérez les demandes et choisissez les
              créneaux ouverts aux clients.
            </p>
          </div>
          <Link
            href={`/owner/places/${place.id}/edit`}
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold"
          >
            <Settings2 className="h-4 w-4" />
            Horaires et capacité
          </Link>
        </div>
        <ReservationManagerFilters
          places={places}
          placeId={place.id}
          date={date}
          all={all}
        />
        <h2 className="mt-7 text-lg font-extrabold text-gray-950">
          Service du {dayLabel}
        </h2>
        <section
          aria-label="Bilan de la journée"
          className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4"
        >
          {[
            {
              label: "Réservations actives",
              value: summary.active,
              note: `${summary.pending} en attente de confirmation`,
              Icon: Clock3,
            },
            {
              label: "Clients attendus",
              value: summary.guests,
              note: "Demandes en attente comprises",
              Icon: Users,
            },
            {
              label: "Honorées",
              value: summary.completed,
              note: "Clients venus et repas effectué",
              Icon: CheckCircle2,
            },
            {
              label: "Absences",
              value: summary.noShow,
              note: "Réservations non honorées",
              Icon: UserX,
            },
          ].map(({ label, value, note, Icon }) => (
            <article
              key={label}
              className="rounded-2xl border border-gray-200 bg-white p-4"
            >
              <Icon className="h-5 w-5 text-primary-600" />
              <p className="mt-3 text-2xl font-extrabold text-gray-950">
                {value}
              </p>
              <h3 className="mt-1 text-sm font-bold text-gray-800">{label}</h3>
              <p className="mt-1 text-xs leading-5 text-gray-500">{note}</p>
            </article>
          ))}
        </section>

        <section
          aria-label="Liste des réservations"
          className="mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-soft"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5">
            <h2 className="text-xl font-extrabold">
              {all ? "Toutes les réservations" : "Réservations de la journée"}
            </h2>
            <span className="text-sm text-gray-500">{place.name}</span>
          </div>
          {!reservations.length ? (
            <div className="p-8 text-center">
              <CalendarDays className="mx-auto h-8 w-8 text-primary-600" />
              <p className="mt-3 font-semibold text-gray-600">
                {all
                  ? "Aucune réservation enregistrée."
                  : "Aucune réservation pour cette journée."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {reservations.map((reservation) => (
                <article
                  key={reservation.id}
                  className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-extrabold text-gray-950">
                        {reservation.customer.name}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-extrabold ${reservation.status === "PENDING" ? "bg-amber-50 text-amber-800" : reservation.status === "CONFIRMED" ? "bg-green-50 text-green-800" : "bg-gray-100 text-gray-700"}`}
                      >
                        {STATUS_LABELS[reservation.status] ||
                          reservation.status}
                      </span>
                    </div>
                    <p className="mt-2 break-words text-sm text-gray-500">
                      {reservation.customer.email}
                      {reservation.phone ? ` · ${reservation.phone}` : ""}
                    </p>
                    <p className="mt-3 text-sm font-bold text-gray-700">
                      {new Intl.DateTimeFormat("fr-FR", {
                        ...(all ? { dateStyle: "medium" as const } : {}),
                        timeStyle: "short",
                        timeZone: "Africa/Kinshasa",
                      }).format(reservation.dateTime)}{" "}
                      · {reservation.partySize} personne
                      {reservation.partySize > 1 ? "s" : ""} ·{" "}
                      {reservation.durationMinutes} min
                    </p>
                    {reservation.specialRequest && (
                      <p className="mt-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
                        {reservation.specialRequest}
                      </p>
                    )}
                    <p className="mt-3 text-xs font-semibold text-gray-500">
                      {reservation.reference}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <OwnerReservationActions
                      reservationId={reservation.id}
                      currentStatus={reservation.status}
                      dateTime={reservation.dateTime.toISOString()}
                    />
                    <p className="mt-3 text-sm font-semibold text-gray-700">
                      {reservation.reservationPriceMinor === 0
                        ? "Réservation gratuite"
                        : `Tarif convenu : ${formatReservationPrice(reservation.reservationPriceMinor, reservation.reservationCurrency)} pour la réservation`}
                    </p>
                    {reservation.totalAmount !== null && (
                      <p className="mt-2 text-sm text-gray-700">
                        Montant déclaré : {reservation.totalAmount.toFixed(2)}{" "}
                        {reservation.currency}
                      </p>
                    )}
                    <ReservationHistory events={reservation.history} />
                  </div>
                </article>
              ))}
            </div>
          )}
          {(page > 1 || hasNext) && (
            <nav
              aria-label="Pages de réservations"
              className="flex items-center justify-between gap-3 border-t p-5"
            >
              {page > 1 ? (
                <Link
                  className="text-sm font-bold text-primary-700"
                  href={pageHref(page - 1)}
                >
                  Précédent
                </Link>
              ) : (
                <span />
              )}
              <span className="text-sm text-gray-500">Page {page}</span>
              {hasNext && (
                <Link
                  className="text-sm font-bold text-primary-700"
                  href={pageHref(page + 1)}
                >
                  Suivant
                </Link>
              )}
            </nav>
          )}
        </section>
        {!all && (
          <div className="mt-6">
            <ReservationAvailabilityManager
              key={`${place.id}:${date}`}
              placeId={place.id}
              date={date}
              enabled={enabled}
              closed={availability.closed}
              slots={availability.slots}
            />
          </div>
        )}
      </div>
    </main>
  );
}
