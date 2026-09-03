import { prisma } from "@/lib/prisma";
import { EventsContent, type PublicEvent } from "./events-content";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    where: {
      status: "APPROVED",
      startDate: { gte: new Date() },
    },
    include: {
      media: { take: 1, select: { url: true, altText: true } },
      place: {
        select: {
          name: true,
          slug: true,
          neighborhood: true,
          media: { take: 1, select: { url: true, altText: true } },
          categories: {
            take: 1,
            select: { category: { select: { name: true } } },
          },
        },
      },
    },
    orderBy: { startDate: "asc" },
  });

  const serialized: PublicEvent[] = events.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate?.toISOString() || null,
    placeName: event.place.name,
    placeSlug: event.place.slug,
    neighborhood: event.place.neighborhood,
    category: event.place.categories[0]?.category.name || "Événement",
    image:
      event.media[0]?.url ||
      event.place.media[0]?.url ||
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=800&fit=crop",
    imageAlt:
      event.media[0]?.altText ||
      event.place.media[0]?.altText ||
      event.title,
  }));

  return <EventsContent events={serialized} />;
}
