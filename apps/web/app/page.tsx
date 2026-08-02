// apps/web/app/page.tsx
import { Suspense } from "react";
import { PlaceList } from "@/features/places/components/place-list";
import { SearchBarAutocomplete } from "@/features/places/components/search-bar-autocomplete"; // ✅ Nouveau composant
import { Filters } from "@/features/places/components/filters";
import { getPlaces } from "@/features/places/actions";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; neighborhood?: string }>;
}) {
  const params = await searchParams;
  const places = await getPlaces({
    search: params.search,
    category: params.category,
    neighborhood: params.neighborhood,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Découvrez où sortir à Kinshasa
        </h1>
        <p className="text-gray-600 mt-2">
          Restaurants, bars, lounges et événements près de chez vous
        </p>
      </div>

      {/* ✅ Barre de recherche avec autocomplétion */}
      <SearchBarAutocomplete />

      {/* Filtres */}
      <div className="mt-4 mb-8">
        <Filters />
      </div>

      {/* Liste des établissements */}
      <Suspense fallback={<PlaceListSkeleton />}>
        <PlaceList places={places} />
      </Suspense>
    </div>
  );
}

function PlaceListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-200 h-48 rounded-t-lg"></div>
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
