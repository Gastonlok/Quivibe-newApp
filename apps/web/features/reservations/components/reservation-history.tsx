import { STATUS_LABELS } from "../domain";

const ACTORS: Record<string, string> = {
  CUSTOMER: "Client",
  OWNER: "Propriétaire",
  MANAGER: "Responsable",
  EDITOR: "Collaborateur",
  ADMIN: "Administration",
};

export function ReservationHistory({
  events,
}: {
  events: {
    id: string;
    fromStatus: string | null;
    toStatus: string;
    actorRole: string;
    createdAt: Date;
    actor?: { name: string } | null;
  }[];
}) {
  return (
    <details className="mt-4 text-sm text-gray-600">
      <summary className="cursor-pointer font-bold text-primary-700">
        Historique de la réservation
      </summary>
      {events.length ? (
        <ol className="mt-3 space-y-2 border-l-2 border-primary-100 pl-4">
          {events.map((event) => (
            <li key={event.id}>
              <p className="font-semibold">
                {event.fromStatus
                  ? `${STATUS_LABELS[event.fromStatus]} → `
                  : "Création : "}
                {STATUS_LABELS[event.toStatus]}
              </p>
              <p className="text-xs">
                {new Intl.DateTimeFormat("fr-FR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Africa/Kinshasa",
                }).format(event.createdAt)}{" "}
                (Kinshasa) · {ACTORS[event.actorRole] || "Quivibe"}
                {event.actor?.name ? ` · ${event.actor.name}` : ""}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-2 text-xs">
          Les changements antérieurs à l’activation de l’historique ne sont pas
          disponibles.
        </p>
      )}
    </details>
  );
}
