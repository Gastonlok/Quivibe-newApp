import { Suspense } from "react";
import { redirect } from "next/navigation";
import { RestaurantSearch } from "@/features/places/components/restaurant-search";
import { SEARCH_KEYS } from "@/features/places/search-params";
import {
  getPlaces,
  getTopRatedPlaces,
  getRecommendations,
} from "@/features/places/actions";
import { HeroSection } from "@/components/hero-section";
import { OwnerCTA } from "@/components/owner-cta";
import { AnimatedSection } from "@/components/animated-section";
import { CarouselSection } from "@/components/carousel-section";
import { Sparkles, Trophy, Star } from "lucide-react";

export const dynamic = "force-dynamic";
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const legacyQuery = new URLSearchParams();
  for (const key of SEARCH_KEYS)
    if (typeof params[key] === "string" && params[key])
      legacyQuery.set(key, params[key] as string);
  if (legacyQuery.size) redirect(`/discover?${legacyQuery}`);
  const [places, topRated, recommendations] = await Promise.all([
    getPlaces({}),
    getTopRatedPlaces(),
    getRecommendations(),
  ]);
  return (
    <>
      <HeroSection />
      <div className="container relative z-10 mx-auto -mt-7 px-4 pb-10">
        <div
          data-testid="home-search-dock"
          className="sticky top-[var(--site-header-height,73px)] z-40 rounded-3xl border border-gray-100 bg-white p-5 shadow-soft sm:p-7"
        >
          <h2 className="mb-4 text-xl font-extrabold tracking-tight text-gray-950">
            Trouvez votre prochaine table
          </h2>
          <Suspense
            fallback={
              <div className="h-32 animate-pulse rounded-2xl bg-gray-50" />
            }
          >
            <RestaurantSearch />
          </Suspense>
        </div>
        {topRated.length > 0 && (
          <AnimatedSection delay={0.2}>
            <div className="mt-12">
              <CarouselSection
                title="Les plus cotés"
                icon={<Trophy className="h-6 w-6 text-yellow-500" />}
                items={topRated}
                viewAllLink="/discover?sort=rating"
                itemsPerView={4}
              />
            </div>
          </AnimatedSection>
        )}
        {recommendations.length > 0 && (
          <AnimatedSection delay={0.3}>
            <div className="mt-12">
              <CarouselSection
                title="Nos recommandations"
                icon={<Sparkles className="h-6 w-6 text-primary-500" />}
                items={recommendations}
                viewAllLink="/discover"
                itemsPerView={4}
              />
            </div>
          </AnimatedSection>
        )}
        {places.length > 0 && (
          <AnimatedSection delay={0.4}>
            <div className="mt-12">
              <CarouselSection
                title="Nouveautés"
                icon={<Star className="h-6 w-6 text-blue-500" />}
                items={places.slice(0, 12)}
                viewAllLink="/discover?sort=recent"
                itemsPerView={4}
              />
            </div>
          </AnimatedSection>
        )}
        <AnimatedSection delay={0.5}>
          <div className="mt-16">
            <OwnerCTA />
          </div>
        </AnimatedSection>
      </div>
    </>
  );
}
