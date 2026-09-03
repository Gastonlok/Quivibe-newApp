"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  Clock3,
  MapPin,
  Search,
  SlidersHorizontal,
} from "lucide-react";

export interface PublicEvent {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string | null;
  placeName: string;
  placeSlug: string;
  neighborhood: string;
  category: string;
  image: string;
  imageAlt: string;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Africa/Kinshasa",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Kinshasa",
  }).format(new Date(value));
}

export function EventsContent({ events }: { events: PublicEvent[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tous");

  const categories = useMemo(
    () => ["Tous", ...Array.from(new Set(events.map((event) => event.category)))],
    [events],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("fr");
    return events.filter((event) => {
      const matchesCategory = category === "Tous" || event.category === category;
      const matchesQuery =
        !normalized ||
        [event.title, event.description, event.placeName, event.neighborhood]
          .join(" ")
          .toLocaleLowerCase("fr")
          .includes(normalized);
      return matchesCategory && matchesQuery;
    });
  }, [category, events, query]);

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="border-b border-gray-200 bg-white">
        <div className="container py-12 sm:py-16">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-primary-700">
            Agenda Quivibe
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight text-gray-950 sm:text-5xl">
            Les expériences à vivre à Kinshasa
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-600">
            Concerts, brunchs, soirées et rendez-vous gastronomiques proposés par les établissements référencés.
          </p>

          <div className="mt-8 flex max-w-3xl items-center gap-3 rounded-full border border-gray-300 bg-white px-5 py-3 shadow-soft focus-within:border-primary-600 focus-within:ring-4 focus-within:ring-primary-100">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un événement ou un établissement"
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400"
            />
          </div>
        </div>
      </section>

      <div className="container py-10">
        <div className="flex items-center gap-2 overflow-x-auto pb-3">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-gray-500" />
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-extrabold transition ${
                category === item
                  ? "border-primary-600 bg-primary-600 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:border-primary-600 hover:text-primary-700"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-gray-500">
            {filtered.length} événement{filtered.length > 1 ? "s" : ""}
          </p>
        </div>

        {filtered.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-soft">
            <CalendarDays className="mx-auto h-10 w-10 text-primary-600" />
            <h2 className="mt-4 text-xl font-extrabold text-gray-950">
              Aucun événement trouvé
            </h2>
            <p className="mt-2 text-gray-600">
              Modifiez la recherche ou revenez prochainement.
            </p>
          </section>
        ) : (
          <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((event) => (
              <article
                key={event.id}
                className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-medium"
              >
                <Link href={`/events/${event.id}`} className="group block">
                  <div className="relative h-56 overflow-hidden">
                    <Image
                      src={event.image}
                      alt={event.imageAlt}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    />
                    <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-extrabold text-gray-900 shadow-soft backdrop-blur">
                      {formatDate(event.startDate)}
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-primary-700">
                      {event.category}
                    </p>
                    <h2 className="mt-2 text-xl font-extrabold tracking-tight text-gray-950 group-hover:text-primary-700">
                      {event.title}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">
                      {event.description}
                    </p>
                    <div className="mt-4 space-y-2 text-sm font-semibold text-gray-600">
                      <p className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-primary-600" />
                        {formatTime(event.startDate)}
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary-600" />
                        {event.placeName}, {event.neighborhood}
                      </p>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
