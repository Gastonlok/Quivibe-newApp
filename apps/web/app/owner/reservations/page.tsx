import { redirect } from "next/navigation";
import { CalendarDays, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { listOwnerReservationsAction } from "@/features/reservations/actions";
import { OwnerReservationActions } from "@/features/reservations/components/owner-reservation-actions";
import { hasOwnerWorkspaceAccess } from "@/features/owner/access";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  CANCELLED: "Annulée",
  COMPLETED: "Terminée",
  NO_SHOW: "Non honorée",
};

export default async function OwnerReservationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/owner/reservations");
  if (!(await hasOwnerWorkspaceAccess(session.user.id, session.user.role))) redirect("/");

  const reservations = await listOwnerReservationsAction();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-10">
        <p className="text-sm font-extrabold uppercase tracking-wider text-primary-700">
          Espace professionnel
        </p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-gray-950">
          Réservations
        </h1>
        <p className="mt-3 text-gray-600">
          Confirmez les demandes et suivez l’accueil de vos clients.
        </p>

        <section className="mt-8 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-soft">
          {reservations.length === 0 ? (
            <div className="p-10 text-center">
              <CalendarDays className="mx-auto h-10 w-10 text-primary-600" />
              <p className="mt-4 font-bold text-gray-700">
                Aucune réservation enregistrée.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {reservations.map((reservation) => (
                <article
                  key={reservation.id}
                  className="grid gap-5 p-6 lg:grid-cols-[1.5fr_1fr_auto] lg:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-extrabold text-gray-950">
                        {reservation.customer.name}
                      </h2>
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-extrabold text-gray-700">
                        {STATUS_LABELS[reservation.status] || reservation.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {reservation.customer.email}
                      {reservation.phone ? ` · ${reservation.phone}` : ""}
                    </p>
                    {reservation.specialRequest && (
                      <p className="mt-3 rounded-2xl bg-gray-50 p-3 text-sm text-gray-700">
                        {reservation.specialRequest}
                      </p>
                    )}
                  </div>

                  <div className="text-sm font-semibold text-gray-600">
                    <p>{reservation.place.name}</p>
                    <p className="mt-2 flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary-600" />
                      {new Intl.DateTimeFormat("fr-FR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Africa/Kinshasa",
                      }).format(reservation.dateTime)}
                    </p>
                    <p className="mt-2 flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary-600" />
                      {reservation.partySize} personne
                      {reservation.partySize > 1 ? "s" : ""}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-wide text-gray-500">
                      {reservation.reference}
                    </p>
                  </div>

                  <OwnerReservationActions
                    reservationId={reservation.id}
                    currentStatus={reservation.status}
                  />
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
