"use client";

import Link from "next/link";
import { BadgeCheck, ChevronRight, Home, MapPin, Star, UtensilsCrossed } from "lucide-react";
import { FavoriteButton } from "@/features/favorites/components/favorite-button";

interface PlaceHeaderProps {
  place: {
    id: string;
    name: string;
    averageRating: number | null;
    neighborhood: string;
    address: string;
    priceRange: number;
    isFavorite: boolean;
    categories: { category: { name: string } }[];
    reviews: { rating: number }[];
    owner: { ownerVerifiedAt: Date | null };
  };
}

export function PlaceHeader({ place }: PlaceHeaderProps) {
  const categoryNames = place.categories.map(({ category }) => category.name).join(" · ");

  return (
    <header>
      <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap text-sm font-semibold text-gray-500">
        <Link href="/" className="text-primary-700 hover:text-primary-800" aria-label="Accueil"><Home className="h-4 w-4" /></Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/discover" className="hover:text-gray-950">Découvrir</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="truncate text-gray-800">{place.name}</span>
      </nav>

      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-950 sm:text-4xl">{place.name}</h1>
          {place.owner.ownerVerifiedAt && <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-extrabold text-primary-800"><BadgeCheck className="h-4 w-4" />Propriétaire vérifié</p>}
          <div className="mt-3 space-y-2 text-sm text-gray-600 sm:text-base">
            <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary-700" />{place.address}, {place.neighborhood}</p>
            <p className="flex items-center gap-2"><UtensilsCrossed className="h-5 w-5 shrink-0 text-primary-700" />{categoryNames || "Restaurant"} · Budget {"$".repeat(Math.max(1, place.priceRange))}</p>
            {place.averageRating !== null && <p className="flex items-center gap-2 font-semibold text-gray-800"><Star className="h-5 w-5 fill-amber-400 text-amber-400" />{place.averageRating.toFixed(1)} <span className="font-normal text-gray-500">({place.reviews.length} avis)</span></p>}
          </div>
        </div>
        <FavoriteButton placeId={place.id} initialFavorite={place.isFavorite} size="md" className="shrink-0 border border-gray-200 shadow-sm" />
      </div>
    </header>
  );
}
