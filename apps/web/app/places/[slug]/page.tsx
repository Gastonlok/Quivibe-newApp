import { notFound } from "next/navigation";
import Image from "next/image";
import { Suspense } from "react";
import { getPlaceBySlug } from "@/features/places/actions";
import { PlaceHeader } from "@/features/places/components/place-header";
import { PlaceInfo } from "@/features/places/components/place-info";
import { PlaceReviews } from "@/features/places/components/place-reviews";
import { PlaceMap } from "@/features/places/components/place-map";
import { PlaceEvents } from "@/features/places/components/place-events";

interface PlacePageProps {
  params: Promise<{ slug: string }>;
}

export default async function PlacePage({ params }: PlacePageProps) {
  const { slug } = await params;
  const place = await getPlaceBySlug(slug);

  if (!place) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PlaceHeader place={place} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              À propos de cet établissement
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {place.description}
            </p>
          </section>

          <PlaceInfo place={place} />
          <PlaceEvents placeId={place.id} />

          <Suspense fallback={<ReviewsSkeleton />}>
            <PlaceReviews placeId={place.id} />
          </Suspense>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-3">
              Localisation
            </h3>
            <div className="h-64 rounded-lg overflow-hidden">
              <PlaceMap
                latitude={place.latitude}
                longitude={place.longitude}
                name={place.name}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              📍 {place.address}, {place.neighborhood}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
            <button className="w-full py-2 px-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
              ❤️ Ajouter aux favoris
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-100 p-4 rounded-lg">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
