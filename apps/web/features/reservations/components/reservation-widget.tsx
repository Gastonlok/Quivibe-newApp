"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CheckCircle2, Clock3, Loader2, Users } from "lucide-react";
import {
  createReservationAction,
  getAvailableSlotsAction,
} from "../actions";

interface ReservationWidgetProps {
  placeId: string;
  placeSlug: string;
  maxPartySize: number;
}

function toLocalDateInput(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function tomorrow() {
  const value = new Date();
  value.setDate(value.getDate() + 1);
  return toLocalDateInput(value);
}

export function ReservationWidget({
  placeId,
  placeSlug,
  maxPartySize,
}: ReservationWidgetProps) {
  const router = useRouter();
  const [date, setDate] = useState(tomorrow());
  const [partySize, setPartySize] = useState(2);
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<{
    reference: string;
    status: string;
  } | null>(null);

  const partyOptions = useMemo(
    () => Array.from({ length: Math.max(1, maxPartySize) }, (_, index) => index + 1),
    [maxPartySize],
  );

  useEffect(() => {
    let active = true;
    setLoadingSlots(true);
    setTime("");
    getAvailableSlotsAction({ placeId, date, partySize })
      .then((result) => {
        if (!active) return;
        setSlots(result.slots);
        setError(result.success ? "" : result.error || "");
      })
      .finally(() => active && setLoadingSlots(false));
    return () => {
      active = false;
    };
  }, [date, partySize, placeId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!time) {
      setError("Sélectionnez une heure disponible.");
      return;
    }

    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError("");

    const result = await createReservationAction({
      placeId,
      date,
      time,
      partySize,
      phone: String(form.get("phone") || ""),
      specialRequest: String(form.get("specialRequest") || ""),
    });

    setSubmitting(false);
    if (!result.success) {
      if (result.code === "UNAUTHENTICATED") {
        router.push(`/login?callbackUrl=/places/${placeSlug}`);
        return;
      }
      setError(result.error);
      return;
    }

    setConfirmation({ reference: result.reference, status: result.status });
  }

  if (confirmation) {
    return (
      <aside className="rounded-3xl border border-primary-100 bg-white p-6 shadow-medium">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
          <CheckCircle2 className="h-6 w-6 text-primary-600" />
        </div>
        <h2 className="mt-4 text-xl font-extrabold text-gray-950">
          Table réservée
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          {confirmation.status === "CONFIRMED"
            ? "Votre réservation est confirmée."
            : "Votre demande a été transmise au restaurant."}
        </p>
        <div className="mt-4 rounded-2xl bg-gray-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Référence
          </p>
          <p className="mt-1 text-lg font-extrabold text-gray-950">
            {confirmation.reference}
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/reservations")}
          className="mt-5 w-full rounded-full bg-primary-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-700"
        >
          Voir mes réservations
        </button>
      </aside>
    );
  }

  return (
    <aside className="rounded-3xl border border-gray-200 bg-white p-6 shadow-medium">
      <h2 className="text-xl font-extrabold tracking-tight text-gray-950">
        Réserver une table
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Confirmation rapide, sans frais.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <label className="block">
          <span className="mb-1.5 flex items-center gap-2 text-sm font-bold text-gray-800">
            <CalendarDays className="h-4 w-4 text-primary-600" />
            Date
          </span>
          <input
            type="date"
            name="date"
            min={toLocalDateInput(new Date())}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-primary-600 focus:ring-4 focus:ring-primary-100"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 flex items-center gap-2 text-sm font-bold text-gray-800">
            <Users className="h-4 w-4 text-primary-600" />
            Nombre de personnes
          </span>
          <select
            name="partySize"
            value={partySize}
            onChange={(event) => setPartySize(Number(event.target.value))}
            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-primary-600 focus:ring-4 focus:ring-primary-100"
          >
            {partyOptions.map((value) => (
              <option key={value} value={value}>
                {value} personne{value > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </label>

        <fieldset>
          <legend className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-800">
            <Clock3 className="h-4 w-4 text-primary-600" />
            Heure
          </legend>
          {loadingSlots ? (
            <div className="flex min-h-20 items-center justify-center rounded-2xl bg-gray-50">
              <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
            </div>
          ) : slots.length ? (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setTime(slot)}
                  aria-pressed={time === slot}
                  className={`rounded-full border px-3 py-2 text-sm font-bold transition ${
                    time === slot
                      ? "border-primary-600 bg-primary-600 text-white"
                      : "border-gray-300 bg-white text-gray-800 hover:border-primary-600 hover:text-primary-700"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
              Aucun créneau disponible pour cette date.
            </p>
          )}
        </fieldset>

        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-gray-800">
            Téléphone
          </span>
          <input
            type="tel"
            name="phone"
            autoComplete="tel"
            placeholder="+243 8..."
            className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-primary-600 focus:ring-4 focus:ring-primary-100"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-gray-800">
            Demande particulière
          </span>
          <textarea
            name="specialRequest"
            rows={3}
            maxLength={500}
            placeholder="Allergie, anniversaire, emplacement..."
            className="w-full resize-none rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-primary-600 focus:ring-4 focus:ring-primary-100"
          />
        </label>

        {error && (
          <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !time}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-soft transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Confirmer la réservation
        </button>
      </form>
    </aside>
  );
}
