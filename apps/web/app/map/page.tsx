import { prisma } from "@/lib/prisma";
import { MapContent, type PublicMapPlace } from "./map-content";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const places = await prisma.place.findMany({
    where: { status: "APPROVED" },
    include: {
      categories: {
        take: 1,
        select: { category: { select: { name: true } } },
      },
      media: { take: 1, select: { url: true, altText: true } },
      reviews: {
        where: { status: "APPROVED" },
        select: { rating: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const serialized: PublicMapPlace[] = places.map((place) => ({
    id: place.id,
    slug: place.slug,
    name: place.name,
    lat: place.latitude,
    lng: place.longitude,
    category: place.categories[0]?.category.name || "Établissement",
    neighborhood: place.neighborhood,
    rating:
      place.reviews.length > 0
        ? place.reviews.reduce((sum, review) => sum + review.rating, 0) /
          place.reviews.length
        : null,
    image: place.media[0]?.url || null,
    imageAlt: place.media[0]?.altText || place.name,
  }));

  return <MapContent places={serialized} />;
}
