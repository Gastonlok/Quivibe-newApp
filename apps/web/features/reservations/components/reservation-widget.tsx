"use client";

import { PhoneInput } from "@/components/phone-input";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Users,
} from "lucide-react";
import {
  createReservationAction,
  getAvailableSlotsAction,
  joinReservationWaitlistAction,
} from "../actions";
import { trackPlaceInteraction } from "@/features/owner/components/place-interaction-tracker";
import { ensurePlaceVisit } from "@/features/owner/components/visit-session";
import { kinshasaDay, MAX_BOOKING_DAYS } from "../domain";
import { formatReservationPrice } from "../pricing";

interface ReservationWidgetProps {
  placeId: string;
  placeSlug: string;
  maxPartySize: number;
  reservationPriceMinor: number;
  reservationCurrency: string;
}

function toLocalDateInput(value: Date) {
  return kinshasaDay(value);
}

function tomorrow() {
  return kinshasaDay(new Date(Date.now() + 24 * 60 * 60_000));
}

export function ReservationWidget({
  placeId,
  placeSlug,
  maxPartySize,
  reservationPriceMinor,
  reservationCurrency,
}: ReservationWidgetProps) {
  const router = useRouter();
  const busy = useRef(false);
  const request = useRef<{ payload: string; key: string } | null>(null);
  const requestedSlot = useRef<string | null>(null);
  const [date, setDate] = useState(tomorrow());
  const [partySize, setPartySize] = useState(2);
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [dayClosed, setDayClosed] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [quote, setQuote] = useState({
    amountMinor: reservationPriceMinor,
    currency: reservationCurrency as "USD" | "CDF",
  });
  const [confirmation, setConfirmation] = useState<{
    reference: string;
    status: string;
    amountMinor: number;
    currency: string;
  } | null>(null);
  const [waitlistMessage, setWaitlistMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedDate = params.get("date");
    const requestedParty = Number(params.get("partySize"));
    requestedSlot.current = params.get("time");
    if (requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
      const parsedDate = new Date(`${requestedDate}T12:00:00Z`);
      if (
        !Number.isNaN(parsedDate.getTime()) &&
        parsedDate.toISOString().slice(0, 10) === requestedDate
      )
        setDate(requestedDate);
    }
    if (
      Number.isInteger(requestedParty) &&
      requestedParty >= 1 &&
      requestedParty <= maxPartySize
    )
      setPartySize(requestedParty);
  }, [maxPartySize]);

  const partyOptions = useMemo(
    () =>
      Array.from(
        { length: Math.max(1, maxPartySize) },
        (_, index) => index + 1,
      ),
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
        if (result.success) {
          setQuote(result.quote);
          setDayClosed(result.closed);
        }
        if (
          requestedSlot.current &&
          result.success &&
          result.slots.includes(requestedSlot.current)
        ) {
          setTime(requestedSlot.current);
        }
        requestedSlot.current = null;
        setError(result.success ? "" : result.error || "");
      })
      .catch(() => {
        if (active) {
          setSlots([]);
          setError("Impossible de charger les disponibilités. Réessayez.");
        }
      })
      .finally(() => active && setLoadingSlots(false));
    return () => {
      active = false;
    };
  }, [date, partySize, placeId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    if (!time || loadingSlots) {
      setError("Sélectionnez une heure disponible.");
      return;
    }

    const form = new FormData(event.currentTarget);
    busy.current = true;
    setSubmitting(true);
    setError("");
    const input = {
      placeId,
      date,
      time,
      partySize,
      phone: String(form.get("phone") || ""),
      specialRequest: String(form.get("specialRequest") || ""),
      expectedPriceMinor: quote.amountMinor,
      expectedCurrency: quote.currency,
    };
    const payload = JSON.stringify(input);
    if (request.current?.payload !== payload)
      request.current = { payload, key: crypto.randomUUID() };
    try {
      await ensurePlaceVisit(placeId);
      trackPlaceInteraction(placeId, "RESERVATION_START");
      const result = await createReservationAction({
        ...input,
        requestKey: request.current.key,
      });
      if (!result.success) {
        if (result.code === "UNAUTHENTICATED") {
          const params = new URLSearchParams(window.location.search);
          params.set("date", date);
          params.set("partySize", String(partySize));
          params.set("time", time);
          router.push(
            `/login?callbackUrl=${encodeURIComponent(`/places/${placeSlug}?${params}#reservation`)}`,
          );
          return;
        }
        setError(result.error);
        if (
          [
            "PRICE_CHANGED",
            "SLOT_CLOSED",
            "NO_CAPACITY",
            "INVALID_SLOT",
            "DISABLED",
          ].includes(result.code)
        ) {
          // Keep the error visible and require a second explicit confirmation.
          const refreshed = await getAvailableSlotsAction({
            placeId,
            date,
            partySize,
          });
          setSlots(refreshed.slots);
          if (refreshed.success) {
            setQuote(refreshed.quote);
            setDayClosed(refreshed.closed);
          }
          if (!refreshed.success || !refreshed.slots.includes(time))
            setTime("");
        }
        return;
      }

      setConfirmation({
        reference: result.reference,
        status: result.status,
        amountMinor: input.expectedPriceMinor,
        currency: input.expectedCurrency,
      });
    } catch {
      setError(
        "La réponse n’a pas pu être reçue. Réessayez sans modifier le formulaire ou consultez vos réservations.",
      );
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  }

  async function joinWaitlist() {
    if (busy.current) return;
    busy.current = true;
    setSubmitting(true);
    setError("");
    try {
      const result = await joinReservationWaitlistAction({
        placeId,
        date,
        partySize,
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
      setWaitlistMessage(
        "Vous etes inscrit(e) sur la liste d'attente pour cette date.",
      );
    } catch {
      setError("Impossible d’enregistrer la demande. Réessayez.");
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  }

  if (confirmation) {
    return (
      <aside className="rounded-3xl border border-primary-100 bg-white p-6 shadow-medium">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
          <CheckCircle2 className="h-6 w-6 text-primary-600" />
        </div>
        <h2 className="mt-4 text-xl font-extrabold text-gray-950">
          {confirmation.status === "CONFIRMED"
            ? "Table réservée"
            : "Demande enregistrée"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          {confirmation.status === "CONFIRMED"
            ? "Votre réservation est confirmée."
            : "Votre demande a été transmise au restaurant."}
        </p>
        <div className="mt-4 rounded-2xl bg-gray-50 p-4">
          <p className="mb-3 text-sm font-semibold text-gray-700">
            {confirmation.amountMinor === 0
              ? "Réservation gratuite"
              : `Tarif convenu : ${formatReservationPrice(confirmation.amountMinor, confirmation.currency)} pour la réservation. Règlement auprès de l’établissement ; aucun paiement en ligne effectué.`}
          </p>
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
    <aside
      id="reservation"
      className="scroll-mt-24 rounded-3xl border border-gray-200 bg-white p-6 shadow-medium"
    >
      <h2 className="text-xl font-extrabold tracking-tight text-gray-950">
        Réserver une table
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Choisissez votre date et votre créneau.
      </p>
      <div aria-live="polite" className="mt-4 rounded-2xl bg-primary-50 p-4">
        <p className="font-extrabold text-gray-950">
          {quote.amountMinor === 0
            ? "Réservation gratuite"
            : `${formatReservationPrice(quote.amountMinor, quote.currency)} par réservation`}
        </p>
        <p className="mt-1 text-sm leading-6 text-gray-600">
          {quote.amountMinor === 0
            ? "Les consommations sont à régler auprès de l’établissement."
            : "Montant pour tout le groupe, hors consommations. À régler directement auprès de l’établissement. Aucun paiement en ligne."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <fieldset disabled={submitting} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-2 text-sm font-bold text-gray-800">
              <CalendarDays className="h-4 w-4 text-primary-600" />
              Date
            </span>
            <input
              type="date"
              name="date"
              min={toLocalDateInput(new Date())}
              max={kinshasaDay(
                new Date(Date.now() + MAX_BOOKING_DAYS * 86400000),
              )}
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
              <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
                <p>
                  {dayClosed
                    ? "Le restaurant n’accepte pas de nouvelles réservations à cette date."
                    : "Aucun créneau disponible pour cette date."}
                </p>
                {!dayClosed && (
                  <button
                    type="button"
                    onClick={joinWaitlist}
                    disabled={submitting}
                    className="mt-3 font-bold text-primary-700 hover:underline disabled:opacity-50"
                  >
                    {submitting
                      ? "Inscription..."
                      : "Me prévenir si une table se libère"}
                  </button>
                )}
                {waitlistMessage && (
                  <p className="mt-2 font-semibold text-primary-700">
                    {waitlistMessage}
                  </p>
                )}
              </div>
            )}
          </fieldset>

          <PhoneInput />

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

          <div
            role="group"
            aria-label="Tarif à confirmer"
            className="border-t border-gray-200 pt-4"
          >
            <p className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-700">
              <span>Tarif de réservation</span>
              <strong aria-live="polite" className="text-base text-gray-950">
                {quote.amountMinor === 0
                  ? "Gratuit"
                  : formatReservationPrice(quote.amountMinor, quote.currency)}
              </strong>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Aucun paiement en ligne. Consommations non comprises.
            </p>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || loadingSlots || !time}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-soft transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirmer la réservation
          </button>
        </fieldset>
      </form>
    </aside>
  );
}
