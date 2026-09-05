"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import { PlaceCard } from "@/features/places/components/place-card";
import { RestaurantSearch } from "@/features/places/components/restaurant-search";
import { searchRestaurantsAction } from "@/features/places/search-actions";
import {
  emptyRestaurantSearch,
  restaurantSearchSchema,
  searchHref,
  type RestaurantSearch as RestaurantSearchFilters,
} from "@/features/places/search-params";

type Results = Extract<
  Awaited<ReturnType<typeof searchRestaurantsAction>>,
  { success: true }
>["data"];

export default function DiscoverContent() {
  const params = useSearchParams(),
    router = useRouter(),
    query = params.toString();
  const filters = useMemo(() => {
    const parsed = restaurantSearchSchema.safeParse(
      Object.fromEntries(new URLSearchParams(query)),
    );
    return parsed.success ? parsed.data : emptyRestaurantSearch();
  }, [query]);
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    searchRestaurantsAction(Object.fromEntries(new URLSearchParams(query)))
      .then((result) => {
        if (!active) return;
        if (result.success) setResults(result.data);
        else {
          setResults(null);
          setError(result.error);
        }
      })
      .catch(() => {
        if (active) {
          setResults(null);
          setError("Impossible de charger les résultats. Réessayez.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [query, retry]);
  const placeLabel = filters.neighborhood || filters.location || "Kinshasa";
  return (
    <main className="min-h-screen bg-[#faf9f6]">
      <div className="border-b border-gray-100 bg-white">
        <div className="container py-7 sm:py-9">
          <nav
            aria-label="Fil d’Ariane"
            className="mb-5 flex items-center gap-2 text-xs text-gray-500"
          >
            <Link href="/" className="hover:text-primary-700">
              Accueil
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-semibold text-gray-700">Découvrir</span>
          </nav>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary-700">
                Une adresse pour chaque envie
              </p>
              <h1 className="mt-2 break-words text-3xl font-extrabold tracking-tight text-gray-950 sm:text-4xl">
                Où sort-on à {placeLabel} ?
              </h1>
            </div>
            <Link
              href="/map"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary-700 hover:underline"
            >
              Explorer la carte
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <RestaurantSearch />
        </div>
      </div>
      <section
        id="results"
        className="container scroll-mt-28 py-7 sm:py-9"
        aria-label="Résultats de recherche"
        aria-busy={loading}
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div aria-live="polite">
            <h2 className="text-lg font-extrabold text-gray-950">
              {loading
                ? "Recherche des meilleures adresses…"
                : error
                  ? "Recherche indisponible"
                  : `${results?.total || 0} établissement${(results?.total || 0) > 1 ? "s" : ""}${filters.date ? ` disponible${(results?.total || 0) > 1 ? "s" : ""}` : " à découvrir"}`}
            </h2>
            {filters.date && (
              <p className="mt-1 text-xs text-gray-500">
                Pour {filters.partySize} personne
                {filters.partySize > 1 ? "s" : ""} à {filters.time}, heure de
                Kinshasa. Disponibilité revérifiée à la réservation.
              </p>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-500">
            Trier par
            <select
              aria-label="Trier les résultats"
              value={filters.sort}
              onChange={(event) =>
                router.push(
                  searchHref({
                    ...filters,
                    page: 1,
                    sort: event.target.value as RestaurantSearchFilters["sort"],
                  }),
                  { scroll: false },
                )
              }
              className="rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-800 focus:border-primary-600 focus:outline-none"
            >
              <option value="relevance">Pertinence</option>
              <option value="rating">Les mieux notés</option>
              <option value="price">Budget croissant</option>
              <option value="recent">Nouveautés</option>
              {filters.lat !== undefined && (
                <option value="distance">Les plus proches</option>
              )}
            </select>
          </label>
        </div>
        {loading ? (
          <div
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            role="status"
            aria-label="Chargement des restaurants"
          >
            {Array.from({ length: 8 }, (_, index) => (
              <div
                key={index}
                className="animate-pulse overflow-hidden rounded-2xl border border-gray-100 bg-white"
              >
                <div className="h-56 bg-gray-100" />
                <div className="space-y-3 p-5">
                  <div className="h-5 w-3/4 rounded bg-gray-100" />
                  <div className="h-3 w-1/2 rounded bg-gray-100" />
                  <div className="h-3 w-2/3 rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-3xl border border-amber-100 bg-white p-10 text-center"
          >
            <p className="text-gray-700">{error}</p>
            <div className="mt-5 flex justify-center gap-4">
              <button
                type="button"
                onClick={() => setRetry((n) => n + 1)}
                className="font-bold text-primary-700"
              >
                Réessayer
              </button>
              <Link href="/discover" className="font-bold text-gray-500">
                Effacer les critères
              </Link>
            </div>
          </div>
        ) : !results?.places.length ? (
          <div className="rounded-3xl border border-gray-100 bg-white px-6 py-14 text-center">
            <SearchX className="mx-auto h-10 w-10 text-primary-500" />
            <h3 className="mt-5 text-xl font-extrabold text-gray-900">
              Aucune adresse pour ces critères
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Essayez un autre quartier, un autre horaire ou retirez quelques
              filtres pour élargir votre recherche.
            </p>
            <Link
              href="/discover"
              className="mt-6 inline-flex rounded-full bg-primary-600 px-6 py-3 text-sm font-extrabold text-white hover:bg-primary-700"
            >
              Voir tous les établissements
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {results.places.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  searchContext={filters}
                />
              ))}
            </div>
            {results.totalPages > 1 && (
              <nav
                aria-label="Pagination des établissements"
                className="mt-9 flex items-center justify-center gap-5"
              >
                {results.page > 1 ? (
                  <Link
                    href={`${searchHref({ ...filters, page: results.page - 1 })}#results`}
                    className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-bold"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </Link>
                ) : (
                  <span className="text-sm text-gray-400">Précédent</span>
                )}
                <span className="text-sm font-bold text-gray-600">
                  {results.page} / {results.totalPages}
                </span>
                {results.page < results.totalPages ? (
                  <Link
                    href={`${searchHref({ ...filters, page: results.page + 1 })}#results`}
                    className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-bold"
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <span className="text-sm text-gray-400">Suivant</span>
                )}
              </nav>
            )}
          </>
        )}
      </section>
    </main>
  );
}
