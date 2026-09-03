import { prisma } from "@/lib/prisma";
import { QuivibeAiContent } from "./quivibe-ai-content";
import type { QuivibePlace } from "@/features/ai/types";

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

  const serialized: QuivibePlace[] = places.map((place) => ({
    id: place.id,
    slug: place.slug,
    name: place.name,
    category: place.categories[0]?.category.name || "Établissement",
    neighborhood: place.neighborhood,
    description: place.description,
    priceRange: place.priceRange,
    rating:
      place.reviews.length > 0
        ? place.reviews.reduce((sum, review) => sum + review.rating, 0) /
          place.reviews.length
        : null,
    image: place.media[0]?.url || null,
    imageAlt: place.media[0]?.altText || place.name,
    reservationsEnabled: place.reservationsEnabled,
    amenities: place.amenities,
  }));

  return <QuivibeAiContent places={serialized} />;
}
