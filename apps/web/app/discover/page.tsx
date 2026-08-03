"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  SlidersHorizontal,
  Grid3x3,
  LayoutList,
  Star,
  MapPin,
  Utensils,
  Coffee,
  Wine,
  PartyPopper,
  Music,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PlaceCard } from "@/features/places/components/place-card";
import { Filters } from "@/features/places/components/filters";
import { getPlaces } from "@/features/places/actions";

const CATEGORIES = [
  { id: "restaurant", label: "Restaurants", icon: Utensils, color: "bg-red-100 text-red-600" },
  { id: "bar", label: "Bars", icon: Wine, color: "bg-purple-100 text-purple-600" },
  { id: "lounge", label: "Lounges", icon: Coffee, color: "bg-amber-100 text-amber-600" },
  { id: "rooftop", label: "Rooftops", icon: PartyPopper, color: "bg-blue-100 text-blue-600" },
  { id: "cafe", label: "Cafés", icon: Coffee, color: "bg-emerald-100 text-emerald-600" },
  { id: "club", label: "Clubs", icon: Music, color: "bg-pink-100 text-pink-600" },
];

const SORT_OPTIONS = [
  { id: "popular", label: "Les plus populaires" },
  { id: "rating", label: "Les mieux notés" },
  { id: "newest", label: "Les plus récents" },
  { id: "nearby", label: "Près de vous" },
];

export default function DiscoverPage() {
  const searchParams = useSearchParams();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [sortBy, setSortBy] = useState("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchPlaces = async () => {
      setLoading(true);
      try {
        const data = await getPlaces({
          category: selectedCategory || undefined,
        });
        setPlaces(data);
      } catch (error) {
        console.error("Erreur:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaces();
  }, [selectedCategory, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold">Découvrir</h1>
          <p className="text-primary-50 mt-2">
            Explorez les meilleurs lieux de Kinshasa
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Barre de recherche */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Rechercher un lieu, une catégorie..."
            className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>

        {/* Catégories rapides */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(isActive ? "" : cat.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  isActive
                    ? `${cat.color} border-2 border-current`
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filtres et tri */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtres
            </button>
            <span className="text-sm text-gray-500">
              {places.length} résultats
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Vue grille / liste */}
            <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 transition-colors ${
                  viewMode === "grid" ? "bg-primary-50 text-primary-600" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 transition-colors ${
                  viewMode === "list" ? "bg-primary-50 text-primary-600" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <LayoutList className="w-4 h-4" />
              </button>
            </div>

            {/* Tri */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtres avancés (toggle) */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <Filters />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Résultats */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-56 rounded-t-xl"></div>
                <div className="p-4 space-y-3 bg-white rounded-b-xl">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : places.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900">Aucun résultat</h3>
            <p className="text-gray-500 mt-1">Essayez de modifier vos filtres</p>
          </div>
        ) : (
          <div className={viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
          }>
            {places.map((place) => (
              <motion.div
                key={place.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <PlaceCard place={place} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
