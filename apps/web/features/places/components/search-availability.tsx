"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  Minus,
  Plus,
  Users,
} from "lucide-react";
import { kinshasaDay, toKinshasaDate } from "@/features/reservations/domain";
import { type RestaurantSearch } from "../search-params";

export function SearchAvailability({
  filters,
  onApply,
  onClear,
}: {
  filters: RestaurantSearch;
  onApply: (value: { date: string; time: string; partySize: number }) => void;
  onClear: () => void;
}) {
  const today = kinshasaDay(new Date()),
    tomorrow = kinshasaDay(new Date(Date.now() + 86400000));
  const maxDate = kinshasaDay(new Date(Date.now() + 365 * 86400000));
  const [date, setDate] = useState(filters.date || tomorrow);
  const [time, setTime] = useState(filters.time || "19:00");
  const [partySize, setPartySize] = useState(filters.partySize);
  const [month, setMonth] = useState((filters.date || tomorrow).slice(0, 7));
  const [error, setError] = useState("");
  const first = new Date(`${month}-01T12:00:00Z`),
    year = first.getUTCFullYear(),
    monthIndex = first.getUTCMonth();
  const offset = (first.getUTCDay() + 6) % 7,
    days = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  function moveMonth(delta: number) {
    setMonth(
      new Date(Date.UTC(year, monthIndex + delta, 1)).toISOString().slice(0, 7),
    );
  }
  function choose(value: string) {
    setDate(value);
    setMonth(value.slice(0, 7));
    setError("");
  }
  function apply(event: React.FormEvent) {
    event.preventDefault();
    if (
      date < today ||
      date > maxDate ||
      toKinshasaDate(date, time).getTime() < Date.now() + 60 * 60_000
    ) {
      setError("Choisissez un créneau au moins une heure à l’avance.");
      return;
    }
    onApply({ date, time, partySize });
  }
  return (
    <form onSubmit={apply}>
      <div className="grid gap-7 p-5 sm:grid-cols-[1.2fr_1fr] sm:p-7">
        <section aria-label="Choisir une date">
          <div className="mb-4 flex gap-2">
            {[
              [today, "Aujourd’hui"],
              [tomorrow, "Demain"],
            ].map(([value, label]) => (
              <button
                type="button"
                key={value}
                onClick={() => choose(value)}
                aria-pressed={date === value}
                className={`rounded-full border px-4 py-2 text-xs font-bold ${date === value ? "border-primary-600 bg-primary-50 text-primary-800" : "border-gray-200 text-gray-600"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              aria-label="Mois précédent"
              onClick={() => moveMonth(-1)}
              disabled={month <= today.slice(0, 7)}
              className="rounded-full p-2 hover:bg-gray-100 disabled:opacity-25"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-extrabold capitalize" aria-live="polite">
              {new Intl.DateTimeFormat("fr-FR", {
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              }).format(first)}
            </p>
            <button
              type="button"
              aria-label="Mois suivant"
              onClick={() => moveMonth(1)}
              disabled={month >= maxDate.slice(0, 7)}
              className="rounded-full p-2 hover:bg-gray-100 disabled:opacity-25"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {["L", "M", "M", "J", "V", "S", "D"].map((day, index) => (
              <span
                key={index}
                className="py-2 text-xs font-bold text-gray-400"
                aria-hidden="true"
              >
                {day}
              </span>
            ))}
            {Array.from({ length: offset }, (_, index) => (
              <span key={`blank-${index}`} />
            ))}
            {Array.from({ length: days }, (_, index) => {
              const value = `${month}-${String(index + 1).padStart(2, "0")}`;
              return (
                <button
                  type="button"
                  key={value}
                  aria-label={new Intl.DateTimeFormat("fr-FR", {
                    dateStyle: "full",
                    timeZone: "UTC",
                  }).format(new Date(`${value}T12:00Z`))}
                  aria-pressed={date === value}
                  disabled={value < today || value > maxDate}
                  onClick={() => choose(value)}
                  className={`aspect-square rounded-full text-sm font-bold transition disabled:text-gray-300 ${date === value ? "bg-primary-600 text-white" : "text-gray-700 hover:bg-primary-50"}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </section>
        <section className="space-y-6 sm:border-l sm:border-gray-100 sm:pl-6">
          <div>
            <label
              htmlFor="search-booking-time"
              className="mb-3 flex items-center gap-2 text-sm font-extrabold"
            >
              <Clock3 className="h-4 w-4 text-primary-600" /> À quelle heure ?
            </label>
            <input
              id="search-booking-time"
              type="time"
              step="60"
              required
              value={time}
              onChange={(event) => setTime(event.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base font-semibold focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              {["12:00", "13:00", "19:00", "20:00"].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={time === value}
                  onClick={() => setTime(value)}
                  className={`rounded-lg border py-2 text-xs font-bold ${time === value ? "border-primary-600 bg-primary-50 text-primary-800" : "border-gray-200 text-gray-600"}`}
                >
                  {value}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">Heure de Kinshasa</p>
          </div>
          <div>
            <label
              htmlFor="search-party-size"
              className="mb-3 flex items-center gap-2 text-sm font-extrabold"
            >
              <Users className="h-4 w-4 text-primary-600" /> Combien de
              personnes ?
            </label>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-2">
              <button
                type="button"
                aria-label="Une personne de moins"
                disabled={partySize <= 1}
                onClick={() => setPartySize((n) => n - 1)}
                className="rounded-full bg-gray-100 p-2 disabled:opacity-30"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                id="search-party-size"
                aria-label="Nombre de personnes"
                type="number"
                min={1}
                max={30}
                required
                value={partySize}
                onChange={(event) => setPartySize(Number(event.target.value))}
                className="w-14 bg-transparent text-center text-lg font-extrabold"
              />
              <button
                type="button"
                aria-label="Une personne de plus"
                disabled={partySize >= 30}
                onClick={() => setPartySize((n) => n + 1)}
                className="rounded-full bg-gray-100 p-2 disabled:opacity-30"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
      {error && (
        <p
          role="alert"
          className="px-5 pb-4 text-sm font-semibold text-red-700 sm:px-7"
        >
          {error}
        </p>
      )}
      <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-gray-100 bg-white p-5 sm:px-7">
        <button
          type="button"
          onClick={onClear}
          className="text-sm font-bold text-gray-600 underline underline-offset-4"
        >
          Sans date précise
        </button>
        <button
          type="submit"
          className="rounded-full bg-primary-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-primary-700"
        >
          Voir les disponibilités
        </button>
      </div>
    </form>
  );
}
