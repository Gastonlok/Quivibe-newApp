// apps/web/app/discover/discover-content.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PlaceCard } from "@/features/places/components/place-card";
import { listPlacesAction } from "@/features/places/actions";
import { Loader2 } from "lucide-react";
import type { PlaceWithFavorites } from "@/features/places/actions";

export default function DiscoverContent() {
  const searchParams = useSearchParams();
  const [places, setPlaces] = useState<PlaceWithFavorites[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    const fetchPlaces = async () => {
      setLoading(true);
      try {
        const result = await listPlacesAction({
          search: searchParams.get("search") || undefined,
          neighborhood: searchParams.get("neighborhood") || undefined,
          priceRange: searchParams.get("priceRange") || undefined,
          page: searchParams.get("page") || "1",
          category: selectedCategory || undefined,
        });

        if (result.success && result.data) {
          setPlaces(result.data.places);
          setTotal(result.data.total);
        }
      } catch (error) {
        console.error("Erreur:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaces();
  }, [searchParams, selectedCategory]);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(selectedCategory === category ? "" : category);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const searchInput = form.querySelector('input[name="search"]') as HTMLInputElement;
    const params = new URLSearchParams(searchParams);
    if (searchInput.value) {
      params.set("search", searchInput.value);
    } else {
      params.delete("search");
    }
    window.history.pushState(null, "", `?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <main className="px-6 py-10 flex flex-col gap-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Où sort-on ce soir ?</h1>
        <p className="text-gray-600 text-sm mt-1">
          {total} établissement{total > 1 ? "s" : ""} à découvrir à Kinshasa
        </p>
      </div>

      {/* Barre de recherche */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          name="search"
          defaultValue={searchParams.get("search") || ""}
          placeholder="Rechercher un lieu, une ambiance..."
          className="border rounded-lg px-4 py-2 flex-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          Rechercher
        </button>
      </form>

      {/* Filtres par catégorie */}
      <div className="flex gap-2 flex-wrap">
        {["restaurant", "bar", "lounge", "rooftop", "cafe"].map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryClick(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? "bg-primary-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
        {selectedCategory && (
          <button
            onClick={() => setSelectedCategory("")}
            className="px-4 py-2 rounded-full text-sm font-medium bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
          >
            ✕ Effacer
          </button>
        )}
      </div>

      {/* Résultats */}
      {places.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">
            Aucun établissement ne correspond à ta recherche.
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Essaie de modifier tes filtres ou ta recherche.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {places.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      )}
    </main>
  );
}
