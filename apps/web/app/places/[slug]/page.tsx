import { notFound } from "next/navigation";
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


export const dynamic = "force-dynamic";
interface PlacePageProps {
  params: Promise<{ slug: string }>;
}

export default async function PlacePage({ params }: PlacePageProps) {
  const { slug } = await params;
  const place = await getPlaceBySlug(slug);

  if (!place) notFound();

  return (
    <main className="bg-gray-50">
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
