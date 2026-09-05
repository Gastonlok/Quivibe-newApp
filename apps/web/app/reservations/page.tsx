import Link from "next/link";
import { formatReservationPrice } from "@/features/reservations/pricing";
import { redirect } from "next/navigation";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { listMyReservationsAction } from "@/features/reservations/actions";
import { CancelReservationButton } from "@/features/reservations/components/cancel-reservation-button";
import { ReservationHistory } from "@/features/reservations/components/reservation-history";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  CANCELLED: "Annulée",
  COMPLETED: "Réalisée",
  NO_SHOW: "Non honorée",
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-800",
  CONFIRMED: "bg-primary-50 text-primary-700",
  CANCELLED: "bg-red-50 text-red-700",
  COMPLETED: "bg-blue-50 text-blue-700",
  NO_SHOW: "bg-gray-100 text-gray-700",
};

export default async function ReservationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/reservations");

  const reservations = await listMyReservationsAction();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-3xl">
          <p className="text-sm font-extrabold uppercase tracking-wider text-primary-700">
            Mon compte
          </p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-gray-950">
            Mes réservations
          </h1>
          <p className="mt-3 text-gray-600">
            Retrouvez vos tables confirmées, vos demandes et votre historique.
          </p>
        </div>

        {reservations.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-soft">
            <CalendarDays className="mx-auto h-10 w-10 text-primary-600" />
            <h2 className="mt-4 text-xl font-extrabold text-gray-950">
              Aucune réservation
            </h2>
            <p className="mt-2 text-gray-600">
              Découvrez un établissement et choisissez votre prochain créneau.
            </p>
            <Link
              href="/discover"
              className="mt-6 inline-flex rounded-full bg-primary-600 px-6 py-3 text-sm font-extrabold text-white hover:bg-primary-700"
            >
              Découvrir les restaurants
            </Link>
          </section>
        ) : (
          <div className="mt-8 space-y-4">
            {reservations.map((reservation) => {
              const canCancel =
                ["PENDING", "CONFIRMED"].includes(reservation.status) &&
                reservation.dateTime.getTime() > Date.now();

              return (
                <article
                  key={reservation.id}
                  className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft"
                >
                  <div className="flex flex-col justify-between gap-5 sm:flex-row">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          href={`/places/${reservation.place.slug}`}
                          className="text-xl font-extrabold text-gray-950 hover:text-primary-700"
                        >
                          {reservation.place.name}
                        </Link>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                            STATUS_STYLES[reservation.status] ||
                            STATUS_STYLES.NO_SHOW
                          }`}
                        >
                          {STATUS_LABELS[reservation.status] ||
                            reservation.status}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-2 text-sm font-semibold text-gray-600">
                        <p className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-primary-600" />
                          {new Intl.DateTimeFormat("fr-FR", {
                            dateStyle: "full",
                            timeStyle: "short",
                            timeZone: "Africa/Kinshasa",
                          }).format(reservation.dateTime)}
                        </p>
                        <p className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary-600" />
                          {reservation.partySize} personne
                          {reservation.partySize > 1 ? "s" : ""}
                        </p>
                        <p className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary-600" />
                          {reservation.place.neighborhood}
                        </p>
                      </div>

                      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-gray-500">
                        Référence {reservation.reference}
                      </p>
                      <p className="mt-3 text-sm font-semibold text-gray-700">
                        {reservation.reservationPriceMinor === 0
                          ? "Réservation gratuite"
                          : `Tarif convenu : ${formatReservationPrice(reservation.reservationPriceMinor, reservation.reservationCurrency)} pour la réservation, hors consommations. Aucun paiement en ligne effectué.`}
                      </p>
                    </div>

                    {canCancel && (
                      <div className="self-start">
                        <CancelReservationButton
                          reservationId={reservation.id}
                        />
                      </div>
                    )}
                  </div>
                  <ReservationHistory events={reservation.history} />
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
