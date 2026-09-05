"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { updateReservationDayAction } from "../actions";
import { kinshasaDay, MAX_BOOKING_DAYS } from "../domain";

export function ReservationManagerFilters({
  places,
  placeId,
  date,
  all,
}: {
  places: { id: string; name: string }[];
  placeId: string;
  date: string;
  all: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  function navigate(next: { placeId?: string; date?: string; all?: boolean }) {
    const params = new URLSearchParams({
      placeId: next.placeId || placeId,
      date: next.date || date,
    });
    if (next.all ?? all) params.set("view", "all");
    startTransition(() =>
      router.push(`/owner/reservations?${params}`, { scroll: false }),
    );
  }
  useEffect(() => {
    const refresh = () => {
      if (!document.hidden && !pending) startTransition(() => router.refresh());
    };
    const interval = window.setInterval(refresh, 30_000);
    return () => window.clearInterval(interval);
  }, [router, pending]);
  function shiftDay(offset: number) {
    const next = new Date(`${date}T12:00:00Z`);
    next.setUTCDate(next.getUTCDate() + offset);
    navigate({ date: next.toISOString().slice(0, 10), all: false });
  }
  const inputClass =
    "mt-1.5 w-full min-w-0 rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold";
  return (
    <section
      aria-label="Filtres du planning"
      aria-busy={pending}
      className="mt-6 space-y-4 rounded-3xl border border-gray-200 bg-white p-4 sm:p-6"
    >
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
        <label className="min-w-0 text-sm font-bold text-gray-800">
          Établissement
          <select
            aria-label="Établissement du planning"
            value={placeId}
            onChange={(e) => navigate({ placeId: e.target.value })}
            className={inputClass}
            disabled={pending}
          >
            {places.map((place) => (
              <option key={place.id} value={place.id}>
                {place.name}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 text-sm font-bold text-gray-800">
          Date du planning
          <input
            type="date"
            value={date}
            onChange={(e) => {
              if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value))
                navigate({ date: e.target.value, all: false });
            }}
            className={inputClass}
            disabled={pending}
          />
        </label>
        <div className="flex gap-2">
          <button
            aria-label="Jour précédent"
            onClick={() => shiftDay(-1)}
            disabled={pending}
            className="rounded-xl border p-3 hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() =>
              navigate({ date: kinshasaDay(new Date()), all: false })
            }
            disabled={pending}
            className="rounded-xl border px-3 py-2 text-sm font-bold hover:bg-gray-50"
          >
            Aujourd’hui
          </button>
          <button
            aria-label="Jour suivant"
            onClick={() => shiftDay(1)}
            disabled={pending}
            className="rounded-xl border p-3 hover:bg-gray-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            aria-pressed={!all}
            onClick={() => navigate({ all: false })}
            disabled={pending}
            className={`rounded-full px-4 py-2 text-sm font-bold ${!all ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700"}`}
          >
            <CalendarDays className="mr-2 inline h-4 w-4" />
            Journée
          </button>
          <button
            aria-pressed={all}
            onClick={() => navigate({ all: true })}
            disabled={pending}
            className={`rounded-full px-4 py-2 text-sm font-bold ${all ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700"}`}
          >
            Toutes les réservations
          </button>
        </div>
        <button
          onClick={() => startTransition(() => router.refresh())}
          disabled={pending}
          className="inline-flex items-center gap-2 text-sm font-bold text-primary-700"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Actualiser
        </button>
      </div>
      <p className="text-xs text-gray-500">
        Heures de Kinshasa. Actualisation automatique toutes les 30 secondes
        lorsque cette page est visible.
      </p>
    </section>
  );
}

export function ReservationAvailabilityManager({
  placeId,
  date,
  enabled,
  closed,
  slots,
}: {
  placeId: string;
  date: string;
  enabled: boolean;
  closed: boolean;
  slots: {
    time: string;
    remaining: number;
    closed: boolean;
    bookable: boolean;
    past: boolean;
  }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    error: boolean;
    text: string;
  } | null>(null);
  const editable =
    date >= kinshasaDay(new Date()) &&
    date <= kinshasaDay(new Date(Date.now() + MAX_BOOKING_DAYS * 86400000));
  function update(close: boolean, time?: string) {
    setFeedback(null);
    startTransition(async () => {
      try {
        const result = await updateReservationDayAction({
          placeId,
          date,
          time,
          closed: close,
        });
        setFeedback(
          result.success
            ? {
                error: false,
                text: time
                  ? `Créneau de ${time} ${close ? "fermé" : "rouvert"}.`
                  : close
                    ? "Journée fermée aux nouvelles réservations."
                    : "Tous les créneaux de la journée sont ouverts.",
              }
            : { error: true, text: result.error },
        );
        router.refresh();
      } catch {
        setFeedback({
          error: true,
          text: "Impossible de modifier la disponibilité. Réessayez.",
        });
      }
    });
  }
  return (
    <section
      aria-label="Disponibilités du restaurant"
      className="rounded-3xl border border-gray-200 bg-white p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-950">
            Disponibilités
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
            Fermer un créneau empêche les nouvelles arrivées à cette heure. Les
            réservations déjà reçues restent à honorer. Les places libres
            tiennent compte des réservations en attente et confirmées.
          </p>
        </div>
        {editable && enabled && (
          <button
            disabled={pending}
            onClick={() => update(!closed)}
            className={`rounded-full px-4 py-2.5 text-sm font-bold disabled:opacity-50 ${closed ? "bg-primary-600 text-white" : "border border-red-200 text-red-700"}`}
          >
            {pending && (
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
            )}
            {closed ? "Rouvrir la journée" : "Fermer la journée"}
          </button>
        )}
      </div>
      {!enabled && (
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          Les réservations sont désactivées ou la fiche n’est pas encore
          publiée. Vous pouvez consulter le planning et gérer les réservations
          existantes.
        </p>
      )}
      {closed && (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
          Journée fermée aux nouvelles réservations.
        </p>
      )}
      {feedback && (
        <p
          role={feedback.error ? "alert" : "status"}
          className={`mt-4 rounded-xl p-3 text-sm ${feedback.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-800"}`}
        >
          {feedback.text}
        </p>
      )}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {slots.map((slot) => {
          const label = slot.past
            ? "Passé"
            : !enabled || slot.closed
              ? "Fermé"
              : !slot.bookable
                ? "Hors délai"
                : slot.remaining === 0
                  ? "Complet"
                  : "Disponible";
          return (
            <article
              key={slot.time}
              className="rounded-2xl border border-gray-200 p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-1">
                <h3 className="font-extrabold text-gray-950">{slot.time}</h3>
                <span
                  className={`text-xs font-bold ${label === "Disponible" ? "text-green-700" : label === "Fermé" || label === "Complet" ? "text-red-700" : "text-gray-500"}`}
                >
                  {label}
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-600">
                {slot.past
                  ? "Créneau terminé"
                  : `${slot.remaining} place${slot.remaining > 1 ? "s" : ""} libre${slot.remaining > 1 ? "s" : ""}`}
              </p>
              {editable && !slot.past && enabled && !closed && (
                <button
                  aria-label={`${slot.closed ? "Ouvrir" : "Fermer"} le créneau de ${slot.time}`}
                  onClick={() => update(!slot.closed, slot.time)}
                  disabled={pending}
                  className="mt-3 w-full rounded-xl bg-gray-100 px-2 py-2 text-xs font-bold text-gray-800 hover:bg-primary-50 disabled:opacity-50"
                >
                  {slot.closed ? "Ouvrir" : "Fermer"}
                </button>
              )}
            </article>
          );
        })}
      </div>
      {!slots.length && (
        <p className="mt-5 text-sm text-gray-600">
          Aucun créneau configuré. Vérifiez les horaires et la durée des
          réservations dans la fiche de l’établissement.
        </p>
      )}
    </section>
  );
}
