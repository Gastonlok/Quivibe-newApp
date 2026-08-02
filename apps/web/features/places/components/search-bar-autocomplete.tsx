// apps/web/features/places/components/search-bar-autocomplete.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export function SearchBarAutocomplete() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const debouncedSearch = useDebounce(search, 300); // 300ms de délai

  // ✅ Mettre à jour l'URL automatiquement quand la recherche change
  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    if (debouncedSearch.trim()) {
      params.set("search", debouncedSearch.trim());
    } else {
      params.delete("search");
    }

    // ✅ Mettre à jour l'URL sans recharger la page
    router.push(`/?${params.toString()}`);
  }, [debouncedSearch, router, searchParams]);

  // ✅ Réinitialiser la recherche
  const handleClear = () => {
    setSearch("");
  };

  return (
    <div className="relative max-w-2xl">
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un restaurant, un bar, un lounge..."
          className="w-full px-4 py-3 pl-12 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
          autoFocus
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />

        {/* ✅ Bouton pour effacer la recherche */}
        {search && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Effacer la recherche"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* ✅ Indicateur de recherche en cours (optionnel) */}
      {search && search !== debouncedSearch && (
        <div className="absolute right-16 top-1/2 -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-500 border-t-transparent"></div>
        </div>
      )}
    </div>
  );
}
