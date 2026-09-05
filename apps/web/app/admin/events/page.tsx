"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { adminRequest } from "@/features/admin/client";
type Event = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string | null;
  status: string;
  place: { name: string };
};
export default function AdminEventsPage() {
  const { data: session } = useSession();
  const admin = session?.user?.role === "ADMIN";
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [organizerEmail, setOrganizerEmail] = useState("");
  async function refresh() {
    const data = await adminRequest("/api/admin/events");
    setEvents(data.events);
  }
  useEffect(() => {
    void refresh().catch((e) => setError(e.message));
  }, []);
  async function mutate(body: Record<string, unknown>, method = "PATCH") {
    setBusy(true);
    setError("");
    try {
      await adminRequest("/api/admin/events", method, body);
      await refresh();
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main>
      <h1 className="text-3xl font-extrabold">Événements</h1>
      <p className="mt-2 text-gray-600">
        Validez ou retirez les événements de la découverte publique.
      </p>
      {error && (
        <p role="alert" className="my-4 text-red-700">
          {error}
        </p>
      )}
      {editing && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void mutate({
              id: editing.id,
              title: editing.title,
              description: editing.description,
              startDate: new Date(`${editing.startDate}+01:00`).toISOString(),
              endDate: editing.endDate
                ? new Date(`${editing.endDate}+01:00`).toISOString()
                : null,
              ...(organizerEmail ? { organizerEmail } : {}),
            });
          }}
          className="mt-6 space-y-3 rounded-2xl border bg-white p-5"
        >
          <h2 className="font-bold">Modifier l’événement</h2>
          <label className="block">
            Titre
            <input
              required
              value={editing.title}
              onChange={(e) =>
                setEditing({ ...editing, title: e.target.value })
              }
              className="block w-full rounded-lg border p-2"
            />
          </label>
          <label className="block">
            Description
            <textarea
              required
              value={editing.description}
              onChange={(e) =>
                setEditing({ ...editing, description: e.target.value })
              }
              className="block w-full rounded-lg border p-2"
            />
          </label>
          <label className="block">
            Début (Kinshasa)
            <input
              type="datetime-local"
              required
              value={editing.startDate}
              onChange={(e) =>
                setEditing({ ...editing, startDate: e.target.value })
              }
              className="block w-full rounded-lg border p-2"
            />
          </label>
          <label className="block">
            Fin (facultative)
            <input
              type="datetime-local"
              value={editing.endDate || ""}
              onChange={(e) =>
                setEditing({ ...editing, endDate: e.target.value || null })
              }
              className="block w-full rounded-lg border p-2"
            />
          </label>
          <label className="block">
            Réaffecter à un organisateur (e-mail facultatif)
            <input
              type="email"
              value={organizerEmail}
              onChange={(e) => setOrganizerEmail(e.target.value)}
              className="block w-full rounded-lg border p-2"
            />
          </label>
          <button
            disabled={busy}
            className="rounded-xl bg-primary-600 px-4 py-2 font-bold text-white"
          >
            Enregistrer
          </button>
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="ml-4"
          >
            Annuler
          </button>
        </form>
      )}
      <div className="mt-6 space-y-4">
        {events.map((event) => (
          <article key={event.id} className="rounded-2xl border bg-white p-5">
            <h2 className="font-bold">{event.title}</h2>
            <p className="text-sm text-gray-500">
              {event.place.name} ·{" "}
              {new Date(event.startDate).toLocaleString("fr-FR")}
            </p>
            <p className="mt-2 whitespace-pre-wrap">{event.description}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <select
                aria-label={`Statut de ${event.title}`}
                disabled={busy}
                value={event.status}
                onChange={(e) =>
                  void mutate({ id: event.id, status: e.target.value })
                }
                className="rounded-lg border p-2"
              >
                <option value="PENDING">En attente</option>
                <option value="APPROVED">Approuvé</option>
                <option value="REJECTED">Retiré</option>
              </select>
              {admin && (
                <>
                  <button
                    disabled={busy}
                    onClick={() => {
                      setEditing({
                        ...event,
                        startDate: new Date(
                          new Date(event.startDate).getTime() + 3600000,
                        )
                          .toISOString()
                          .slice(0, 16),
                        endDate: event.endDate
                          ? new Date(
                              new Date(event.endDate).getTime() + 3600000,
                            )
                              .toISOString()
                              .slice(0, 16)
                          : null,
                      });
                      setOrganizerEmail("");
                    }}
                  >
                    Modifier
                  </button>
                  <button
                    disabled={busy}
                    className="text-red-700"
                    onClick={() => {
                      if (confirm(`Supprimer ${event.title} ?`))
                        void mutate({ id: event.id }, "DELETE");
                    }}
                  >
                    Supprimer
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
        {!events.length && <p>Aucun événement.</p>}
      </div>
    </main>
  );
}
