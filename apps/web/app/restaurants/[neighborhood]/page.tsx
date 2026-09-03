import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site";
import { PlaceCard } from "@/features/places/components/place-card";
import { slugify } from "@/utils/slugify";

type PageProps = { params: Promise<{ neighborhood: string }> };

async function getNeighborhood(slug: string) {
  const neighborhoods = await prisma.place.findMany({ where: { status: "APPROVED" }, select: { neighborhood: true }, distinct: ["neighborhood"] });
  return neighborhoods.find((item) => slugify(item.neighborhood) === slug)?.neighborhood;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const neighborhood = await getNeighborhood((await params).neighborhood);
  if (!neighborhood) return { title: "Quartier introuvable | Quivibe" };
  const title = `Restaurants à ${neighborhood}, Kinshasa | Quivibe`;
  const description = `Découvrez les restaurants, bars et lieux de sortie à ${neighborhood}, Kinshasa. Comparez les avis, les budgets et réservez votre table sur Quivibe.`;
  return { title, description, alternates: { canonical: `/restaurants/${slugify(neighborhood)}` }, openGraph: { title, description, url: `${siteUrl}/restaurants/${slugify(neighborhood)}`, type: "website" } };
}

export default async function NeighborhoodPage({ params }: PageProps) {
  const neighborhood = await getNeighborhood((await params).neighborhood);
  if (!neighborhood) notFound();
  const places = await prisma.place.findMany({
    where: { status: "APPROVED", neighborhood },
    include: { media: { take: 2, orderBy: { createdAt: "asc" } }, categories: { include: { category: true } }, reviews: { where: { status: "APPROVED" }, select: { rating: true } } },
    orderBy: { createdAt: "desc" },
  });
  const cards = places.map((place) => ({ ...place, averageRating: place.reviews.length ? place.reviews.reduce((sum, review) => sum + review.rating, 0) / place.reviews.length : null }));
  const itemList = { "@context": "https://schema.org", "@type": "ItemList", name: `Restaurants à ${neighborhood}, Kinshasa`, itemListElement: cards.map((place, index) => ({ "@type": "ListItem", position: index + 1, url: `${siteUrl}/places/${place.slug}`, name: place.name })) };

  return <main className="min-h-screen bg-gray-50"><div className="container py-10 sm:py-14"><Link href="/discover" className="text-sm font-extrabold text-primary-700 hover:underline">Découvrir tous les lieux</Link><p className="mt-6 inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.16em] text-primary-700"><MapPin className="h-4 w-4" /> Kinshasa</p><h1 className="mt-3 text-4xl font-extrabold tracking-tight text-gray-950 sm:text-5xl">Restaurants à {neighborhood}</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-gray-600">Découvrez les adresses où sortir à {neighborhood} : restaurants, bars, lounges et expériences à réserver.</p><section className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{cards.map((place) => <PlaceCard key={place.id} place={place} />)}</section></div><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} /></main>;
}
