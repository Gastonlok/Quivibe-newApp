// apps/web/features/places/components/place-list.tsx
import Link from "next/link";
import Image from "next/image";
import { Star, MapPin } from "lucide-react";
import { type Place } from "@prisma/client";

interface PlaceWithDetails extends Place {
  categories: { category: { name: string; slug: string } }[];
  media: { url: string; altText: string | null }[];
  averageRating: number | null;
}

export function PlaceList({ places }: { places: PlaceWithDetails[] }) {
  if (places.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">
          Aucun établissement trouvé.
        </p>
        <p className="text-gray-400">
          Essayez de modifier vos filtres ou revenez plus tard.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {places.map((place) => (
        <PlaceCard key={place.id} place={place} />
      ))}
    </div>
  );
}

function PlaceCard({ place }: { place: PlaceWithDetails }) {
  const mainImage = place.media[0]?.url || "/images/placeholder.jpg";
  const category = place.categories[0]?.category.name || "Établissement";

  return (
    <Link href={`/places/${place.slug}`} className="group">
      <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
        <div className="relative h-48">
          <Image
            src={mainImage}
            alt={place.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {place.averageRating !== null && (
            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              {place.averageRating.toFixed(1)}
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                {place.name}
              </h3>
              <p className="text-sm text-gray-500">{category}</p>
            </div>
          </div>

          <div className="mt-2 flex items-center text-sm text-gray-500">
            <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="truncate">{place.neighborhood}</span>
          </div>

          <div className="mt-2 flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  place.averageRating !== null && i < Math.floor(place.averageRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
            {place.averageRating !== null && (
              <span className="text-sm text-gray-500 ml-1">
                ({place.averageRating.toFixed(1)})
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
