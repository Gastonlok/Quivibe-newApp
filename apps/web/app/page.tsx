import { Suspense } from "react";
import { PlaceList } from "@/features/places/components/place-list";
import { SearchBarAutocomplete } from "@/features/places/components/search-bar-autocomplete";
import { Filters } from "@/features/places/components/filters";
import { getPlaces } from "@/features/places/actions";
import { HeroSection } from "@/components/hero-section";
import { OwnerCTA } from "@/components/owner-cta";
import { TopRatedPlaces } from "@/features/places/components/top-rated-places";
import { Recommendations } from "@/features/places/components/recommendations";
import { AnimatedSection } from "@/components/animated-section";
import { Sparkles, Trophy, Star, ArrowRight } from "lucide-react";
import Link from "next/link";

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

  const isSearching = params.search || params.category || params.neighborhood;

  return (
    <>
      {/* Hero Section avec la valeur de Quivibe */}
      <HeroSection />

      <div className="container mx-auto px-4 py-8">
        {/* Section de recherche */}
        <AnimatedSection>
          <SearchBarAutocomplete />
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <div className="mt-4 mb-8 flex flex-wrap items-center gap-4">
            <Filters />
            {!isSearching && (
              <span className="text-sm text-gray-500">
                {places.length} établissements à découvrir
              </span>
            )}
          </div>
        </AnimatedSection>

        {/* Résultats de recherche */}
        <Suspense fallback={<PlaceListSkeleton />}>
          <PlaceList places={places} />
        </Suspense>

        {/* Section : Restaurants les plus cotés */}
        {!isSearching && (
          <>
            <AnimatedSection delay={0.3}>
              <div className="mt-16 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <Trophy className="w-6 h-6 text-yellow-500" />
                      Les plus cotés
                    </h2>
                    <p className="text-gray-500 mt-1">
                      Les établissements préférés de la communauté Quivibe
                    </p>
                  </div>
                  <Link
                    href="/top-rated"
                    className="text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1"
                  >
                    Voir tout <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              <Suspense fallback={<PlaceListSkeleton />}>
                <TopRatedPlaces />
              </Suspense>
            </AnimatedSection>

            {/* Section : Nos recommandations */}
            <AnimatedSection delay={0.4}>
              <div className="mt-16 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <Sparkles className="w-6 h-6 text-primary-500" />
                      Nos recommandations
                    </h2>
                    <p className="text-gray-500 mt-1">
                      Sélectionnés par notre équipe pour vous
                    </p>
                  </div>
                  <Link
                    href="/recommendations"
                    className="text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1"
                  >
                    Voir tout <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              <Suspense fallback={<PlaceListSkeleton />}>
                <Recommendations />
              </Suspense>
            </AnimatedSection>

            {/* Call to Action pour propriétaires */}
            <AnimatedSection delay={0.5}>
              <div className="mt-16">
                <OwnerCTA />
              </div>
            </AnimatedSection>
          </>
        )}
      </div>
    </>
  );
}

function PlaceListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-200 h-56 rounded-t-xl"></div>
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
