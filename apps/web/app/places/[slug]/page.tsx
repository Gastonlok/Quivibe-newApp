import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import { getPlaceBySlug } from "@/features/places/actions";
import { PlaceHeader } from "@/features/places/components/place-header";
import { PlaceGallery } from "@/features/places/components/place-gallery";
import { PlaceInfo } from "@/features/places/components/place-info";
import { PlaceReviews } from "@/features/places/components/place-reviews";
import { PlaceMap } from "@/features/places/components/place-map";
import { PlaceMenu } from "@/features/places/components/place-menu";
import { DirectionsButton } from "@/features/places/components/directions-button";
import { PlaceEvents } from "@/features/places/components/place-events";
import { ReservationWidget } from "@/features/reservations/components/reservation-widget";
import { PlaceVisitTracker } from "@/features/owner/components/place-visit-tracker";
import { siteUrl } from "@/lib/site";


export const dynamic = "force-dynamic";
interface PlacePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PlacePageProps): Promise<Metadata> {
  const place = await getPlaceBySlug((await params).slug);
  if (!place) return { title: "Établissement introuvable | Quivibe" };

  const title = `${place.name} à ${place.neighborhood}, Kinshasa | Quivibe`;
  const description = place.description.slice(0, 155);
  return {
    title,
    description,
    alternates: { canonical: `/places/${place.slug}` },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/places/${place.slug}`,
      images: place.media[0] ? [{ url: place.media[0].url, alt: place.media[0].altText || place.name }] : [],
    },
  };
}

export default async function PlacePage({ params }: PlacePageProps) {
  const { slug } = await params;
  const place = await getPlaceBySlug(slug);

  if (!place) notFound();
  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: place.name,
    description: place.description,
    image: place.media.map((media) => media.url),
    address: { "@type": "PostalAddress", streetAddress: place.address, addressLocality: place.neighborhood, addressRegion: "Kinshasa", addressCountry: "CD" },
    geo: { "@type": "GeoCoordinates", latitude: place.latitude, longitude: place.longitude },
    priceRange: "$".repeat(place.priceRange),
    url: `${siteUrl}/places/${place.slug}`,
    aggregateRating: place.averageRating !== null ? { "@type": "AggregateRating", ratingValue: place.averageRating.toFixed(1), reviewCount: place.reviews.length } : undefined,
  };

  return (
    <main className="bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }} />
      <PlaceVisitTracker placeId={place.id} />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_23rem]">
          <div className="space-y-8">
            <PlaceHeader place={place} />
            <PlaceGallery placeName={place.name} media={place.media} />

            <nav aria-label="Contenu de l'établissement" className="flex gap-6 overflow-x-auto border-b border-gray-200 text-base font-bold text-gray-500">
              <a href="#a-propos" className="shrink-0 border-b-4 border-gray-950 px-1 pb-4 text-gray-950">À propos</a>
              {place.menuVisible && place.menuItems.length > 0 && <a href="#menu" className="shrink-0 px-1 pb-4 hover:text-gray-950">Menu</a>}
              <a href="#avis" className="shrink-0 px-1 pb-4 hover:text-gray-950">Avis</a>
              <a href="#laisser-un-avis" className="shrink-0 rounded-full bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700">Laisser un avis</a>
            </nav>

            <section id="a-propos" className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-950">
                À propos de cet établissement
              </h2>
              <p className="mt-3 leading-7 text-gray-700">{place.description}</p>
            </section>

            <PlaceInfo place={place} />
            <div id="menu"><PlaceMenu visible={place.menuVisible} items={place.menuItems} /></div>
            <PlaceEvents placeId={place.id} />

            <div id="avis"><Suspense fallback={<ReviewsSkeleton />}>
              <PlaceReviews placeId={place.id} />
            </Suspense></div>
          </div>

          <div className="space-y-6">
            <div className="lg:sticky lg:top-24 lg:space-y-6">
              {place.reservationsEnabled ? (
                <ReservationWidget
                  placeId={place.id}
                  placeSlug={place.slug}
                  maxPartySize={place.maxPartySize}
                />
              ) : (
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
                  <h2 className="text-lg font-extrabold text-gray-950">
                    Réservation non disponible
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Contactez directement l’établissement pour vérifier les disponibilités.
                  </p>
                </div>
              )}

              <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-extrabold text-gray-950">Localisation</h3>
                </div>
                <div className="mt-3 h-64 overflow-hidden rounded-2xl">
                  <PlaceMap
                    latitude={place.latitude}
                    longitude={place.longitude}
                    name={place.name}
                  />
                </div>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  {place.address}, {place.neighborhood}
                </p>
                <DirectionsButton
                  latitude={place.latitude}
                  longitude={place.longitude}
                  placeName={place.name}
                  placeId={place.id}
                />
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function ReviewsSkeleton() {
  return (
    <div className="animate-pulse space-y-4 rounded-3xl bg-white p-6">
      <div className="h-6 w-1/4 rounded bg-gray-200" />
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-20 rounded-2xl bg-gray-100" />
      ))}
    </div>
  );
}
