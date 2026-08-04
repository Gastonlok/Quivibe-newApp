"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Heart, Loader2, MapPin, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getFavorites } from "@/features/favorites/actions";
import { FavoriteButton } from "@/features/favorites/components/favorite-button";

interface FavoritePlace {
  id: string;
  place: {
    id: string;
    name: string;
    slug: string;
    description: string;
    address: string;
    neighborhood: string;
    priceRange: number;
    averageRating: number | null;
    media: { url: string; altText: string | null }[];
    categories: { category: { name: string } }[];
    reviews: { rating: number }[];
  };
  createdAt: string;
}

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoritePlace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    const fetchFavorites = async () => {
      try {
        const result = await getFavorites();
        if (result.success) {
          setFavorites(result.favorites);
        } else {
          setFavorites([]);
        }
      } catch (error) {
        console.error("Erreur:", error);
        setFavorites([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [session, status, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-500 fill-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">Mes favoris</h1>
          </div>
          <p className="text-gray-500 mt-1">
            {favorites.length} établissement{favorites.length > 1 ? "s" : ""} dans vos favoris
          </p>
        </div>

        {/* Liste des favoris */}
        {favorites.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">
              Aucun favori pour le moment
            </h3>
            <p className="text-gray-500 mt-2">
              Commencez à explorer les lieux et ajoutez-les à vos favoris !
            </p>
            <Link
              href="/discover"
              className="inline-block mt-4 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Découvrir des lieux
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((fav) => {
              const place = fav.place;
              const mainImage = place.media[0]?.url || "/images/placeholder.jpg";
              const category = place.categories[0]?.category.name || "Établissement";
              const priceLabels = ["€", "€€", "€€€", "€€€€"];
              const reviewCount = place.reviews?.length || 0;

              return (
                <div
                  key={fav.id}
                  className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all group"
                >
                  <Link href={`/places/${place.slug}`}>
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={mainImage}
                        alt={place.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3">
                        <FavoriteButton placeId={place.id} size="sm" />
                      </div>
                      {place.averageRating !== null && (
                        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-white text-xs font-medium">
                            {place.averageRating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {place.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        <span>{category}</span>
                        <span className="text-xs">•</span>
                        <span>{priceLabels.slice(0, place.priceRange).join(" ")}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{place.neighborhood}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>{place.averageRating?.toFixed(1) || "N/A"}</span>
                        <span>•</span>
                        <span>{reviewCount} avis</span>
                      </div>
                      <div className="mt-3 text-xs text-gray-400">
                        Ajouté le {new Date(fav.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
