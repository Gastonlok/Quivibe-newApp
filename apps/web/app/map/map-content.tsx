"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Search, Star, X } from "lucide-react";

export interface PublicMapPlace {
  id: string;
  slug: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  neighborhood: string;
  rating: number | null;
  image: string | null;
  imageAlt: string;
}

const DynamicMap = dynamic(() => import("@/components/map/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[620px] items-center justify-center rounded-3xl border border-gray-200 bg-gray-100 text-sm font-bold text-gray-500">
      Chargement de la carte…
    </div>
  ),
});

export function MapContent({ places }: { places: PublicMapPlace[] }) {
  const [query, setQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<PublicMapPlace | null>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("fr");
    if (!normalized) return places;
    return places.filter((place) =>
      [place.name, place.category, place.neighborhood]
        .join(" ")
        .toLocaleLowerCase("fr")
        .includes(normalized),
    );
  }, [places, query]);

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="border-b border-gray-200 bg-white">
        <div className="container py-10 sm:py-12">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-primary-700">
            Explorer Kinshasa
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-gray-950 sm:text-5xl">
            Trouvez une table autour de vous
          </h1>
          <p className="mt-3 max-w-2xl text-gray-600">
            La carte utilise les établissements approuvés et leurs coordonnées enregistrées dans Quivibe.
          </p>
        </div>
      </section>

      <div className="container py-8">
        <div className="relative">
          <div className="absolute left-4 right-4 top-4 z-[500] sm:right-auto sm:w-[420px]">
            <div className="flex items-center gap-3 rounded-full border border-gray-300 bg-white px-5 py-3 shadow-medium focus-within:border-primary-600 focus-within:ring-4 focus-within:ring-primary-100">
              <Search className="h-5 w-5 shrink-0 text-gray-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nom, quartier ou catégorie"
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Effacer la recherche"
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <DynamicMap
            places={filtered}
            selectedPlace={selectedPlace}
            onSelectPlace={setSelectedPlace}
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-gray-500">
            {filtered.length} établissement{filtered.length > 1 ? "s" : ""} sur la carte
          </p>
        </div>

        {selectedPlace && (
          <section className="mt-5 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-medium">
            <div className="grid sm:grid-cols-[220px_1fr_auto] sm:items-center">
              <div className="relative h-48 bg-gray-100 sm:h-full sm:min-h-44">
                {selectedPlace.image ? (
                  <Image
                    src={selectedPlace.image}
                    alt={selectedPlace.imageAlt}
                    fill
                    className="object-cover"
                    sizes="220px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <MapPin className="h-10 w-10 text-primary-600" />
                  </div>
                )}
              </div>

              <div className="p-6">
                <p className="text-xs font-extrabold uppercase tracking-wider text-primary-700">
                  {selectedPlace.category}
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-gray-950">
                  {selectedPlace.name}
                </h2>
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-gray-600">
                  <MapPin className="h-4 w-4 text-primary-600" />
                  {selectedPlace.neighborhood}
                </p>
                {selectedPlace.rating !== null && (
                  <p className="mt-2 flex items-center gap-2 text-sm font-extrabold text-gray-800">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {selectedPlace.rating.toFixed(1)} / 5
                  </p>
                )}
              </div>

              <div className="flex gap-2 p-6 pt-0 sm:flex-col sm:pt-6">
                <Link
                  href={`/places/${selectedPlace.slug}?qv_source=MAP`}
                  className="flex-1 rounded-full bg-primary-600 px-5 py-3 text-center text-sm font-extrabold text-white hover:bg-primary-700"
                >
                  Voir et réserver
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedPlace(null)}
                  className="rounded-full border border-gray-300 px-5 py-3 text-sm font-extrabold text-gray-700 hover:bg-gray-100"
                >
                  Fermer
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
