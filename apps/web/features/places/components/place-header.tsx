// apps/web/features/places/components/place-header.tsx
"use client";

import Image from "next/image";
import { Star, MapPin, Phone } from "lucide-react";

interface PlaceHeaderProps {
  place: {
    name: string;
    averageRating: number | null;
    neighborhood: string;
    address: string;
    phone: string | null;
    media: { url: string; altText: string | null }[];
    categories: { category: { name: string } }[];
  };
}

export function PlaceHeader({ place }: PlaceHeaderProps) {
  const mainImage = place.media[0]?.url || "/images/placeholder.jpg";

  return (
    <div className="relative">
      {/* Image principale */}
      <div className="relative h-64 md:h-96 rounded-xl overflow-hidden bg-gray-100">
        <Image
          src={mainImage}
          alt={place.name}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 1200px"
        />
      </div>

      {/* Infos superposées */}
      <div className="mt-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              {place.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {/* Note */}
              {place.averageRating !== null && (
                <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">
                    {place.averageRating.toFixed(1)}
                  </span>
                </div>
              )}
              {/* Catégories */}
              <div className="flex gap-2">
                {place.categories.map(({ category }) => (
                  <span
                    key={category.name}
                    className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Adresse et téléphone */}
        <div className="mt-4 space-y-2 text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-500" />
            <span>
              {place.address}, {place.neighborhood}
            </span>
          </div>
          {place.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary-500" />
              <span>{place.phone}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
