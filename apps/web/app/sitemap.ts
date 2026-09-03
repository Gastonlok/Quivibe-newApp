import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site";
import { slugify } from "@/utils/slugify";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const places = await prisma.place.findMany({
    where: { status: "APPROVED" },
    select: { slug: true, neighborhood: true, updatedAt: true },
  });
  const neighborhoods = new Set(places.map((place) => slugify(place.neighborhood)));

  return [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/discover`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/events`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    ...[...neighborhoods].map((neighborhood) => ({ url: `${siteUrl}/restaurants/${neighborhood}`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 })),
    ...places.map((place) => ({ url: `${siteUrl}/places/${place.slug}`, lastModified: place.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
