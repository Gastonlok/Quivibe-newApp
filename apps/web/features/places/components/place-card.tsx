"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, Utensils } from "lucide-react";
import { AnimatedCard } from "@/components/animated-section";
import { FavoriteButton } from "@/features/favorites/components/favorite-button";

interface PlaceCardProps {
  place: {
    id: string;
    name: string;
    slug: string;
    neighborhood: string;
    averageRating: number | null;
    media: { url: string; altText: string | null }[];
    categories: { category: { name: string } }[];
    priceRange: number;
    reviews?: { rating: number }[];
  };
}

export function PlaceCard({ place }: PlaceCardProps) {
  const mainImage = place.media[0]?.url || "/images/placeholder.jpg";
  const category = place.categories[0]?.category.name || "Établissement";
  const priceLabels = ["€", "€€", "€€€", "€€€€"];
  const reviewCount = place.reviews?.length || 0;

  return (
    <AnimatedCard className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-primary-200 transition-all duration-300">
      <Link href={`/places/${place.slug}`} className="block group">
        <div className="relative h-56 overflow-hidden">
          <Image
            src={mainImage}
            alt={place.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {place.averageRating !== null && (
            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-gray-800 text-sm">
                {place.averageRating.toFixed(1)}
              </span>
              <span className="text-gray-400 text-xs">/ 5</span>
            </div>
          )}

          <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5 text-white" />
            <span className="text-white text-xs font-medium">{category}</span>
          </div>

          {/* ✅ Bouton favoris */}
          <div className="absolute top-3 left-3">
            <FavoriteButton placeId={place.id} size="sm" />
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors text-lg leading-tight">
                {place.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">{category}</span>
                <span className="text-xs text-gray-300">•</span>
                <span className="text-sm text-gray-500">
                  {priceLabels.slice(0, place.priceRange).join(" ")}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center text-sm text-gray-500">
            <MapPin className="w-4 h-4 mr-1 flex-shrink-0 text-primary-400" />
            <span className="truncate">{place.neighborhood}</span>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    place.averageRating !== null && i < Math.floor(place.averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300 fill-gray-300"
                  }`}
                />
              ))}
            </div>
            {place.averageRating !== null && (
              <span className="text-xs font-medium text-gray-700">
                {place.averageRating.toFixed(1)}
              </span>
            )}
            <span className="text-xs text-gray-400">
              ({reviewCount} avis)
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-600 font-medium">Ouvert</span>
            </div>
            <span className="text-xs text-gray-300">•</span>
            <span className="text-xs text-gray-500">Bientôt disponible</span>
          </div>
        </div>
      </Link>
    </AnimatedCard>
  );
}
