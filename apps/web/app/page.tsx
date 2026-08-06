// apps/web/app/page.tsx
import { Suspense } from "react";
import { PlaceCard } from "@/features/places/components/place-card";
import { SearchBarAutocomplete } from "@/features/places/components/search-bar-autocomplete";
import { Filters } from "@/features/places/components/filters";
import { getPlaces, getTopRatedPlaces, getRecommendations } from "@/features/places/actions";
import { HeroSection } from "@/components/hero-section";
import { OwnerCTA } from "@/components/owner-cta";
import { AnimatedSection } from "@/components/animated-section";
import { CarouselSection, CarouselSkeleton } from "@/components/carousel-section";
import { Sparkles, Trophy, Star } from "lucide-react";

// ============================================
// PAGE PRINCIPALE (SERVER COMPONENT)
// ============================================
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; neighborhood?: string }>;
}) {
  const params = await searchParams;
  const isSearching = params.search || params.category || params.neighborhood;

  // ✅ Charger les données côté serveur
  const [places, topRated, recommendations] = await Promise.all([
    getPlaces({
      search: params.search,
      category: params.category,
      neighborhood: params.neighborhood,
    }),
    getTopRatedPlaces(),
    getRecommendations(),
  ]);

  return (
    <>
      {/* Hero Section */}
      <HeroSection />

      <div className="container mx-auto px-4 py-8">
        {/* Barre de recherche - Client Component */}
        <Suspense fallback={<div className="h-12 bg-gray-100 rounded-lg animate-pulse" />}>
          <SearchBarAutocomplete />
        </Suspense>

        {/* Filtres */}
        <div className="mt-4 mb-8 flex flex-wrap items-center gap-4">
          <Suspense fallback={<div className="h-10 w-48 bg-gray-100 rounded-lg animate-pulse" />}>
            <Filters />
          </Suspense>
          {!isSearching && (
            <span className="text-sm text-gray-500">
              {places.length} établissements à découvrir
            </span>
          )}
        </div>

        {/* Résultats de recherche (affichage classique) */}
        {isSearching ? (
          <Suspense fallback={<CarouselSkeleton />}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {places.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
            {places.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">Aucun résultat trouvé</p>
              </div>
            )}
          </Suspense>
        ) : (
          <>
            {/* Section : Les plus cotés */}
            {topRated.length > 0 && (
              <AnimatedSection delay={0.2}>
                <div className="mt-12">
                  <CarouselSection
                    title="Les plus cotés"
                    icon={<Trophy className="w-6 h-6 text-yellow-500" />}
                    items={topRated}
                    viewAllLink="/top-rated"
                    itemsPerView={4}
                  />
                </div>
              </AnimatedSection>
            )}

            {/* Section : Nos recommandations */}
            {recommendations.length > 0 && (
              <AnimatedSection delay={0.3}>
                <div className="mt-12">
                  <CarouselSection
                    title="Nos recommandations"
                    icon={<Sparkles className="w-6 h-6 text-primary-500" />}
                    items={recommendations}
                    viewAllLink="/recommendations"
                    itemsPerView={4}
                  />
                </div>
              </AnimatedSection>
            )}

            {/* Section : Nouveautés */}
            {places.length > 0 && (
              <AnimatedSection delay={0.4}>
                <div className="mt-12">
                  <CarouselSection
                    title="Nouveautés"
                    icon={<Star className="w-6 h-6 text-blue-500" />}
                    items={places.slice(0, 12)}
                    viewAllLink="/discover"
                    itemsPerView={4}
                  />
                </div>
              </AnimatedSection>
            )}

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
