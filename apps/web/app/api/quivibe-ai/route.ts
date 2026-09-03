import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { defaultIntroduction, recommendPlaces } from "@/features/ai/recommend";
import type { QuivibePlace } from "@/features/ai/types";

const requestSchema = z.object({ query: z.string().trim().min(2).max(500) });

function outputText(response: { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> }) {
  return response.output?.flatMap((item) => item.content || []).filter((item) => item.type === "output_text").map((item) => item.text || "").join("") || "";
}

async function enrichIntroduction(query: string, places: QuivibePlace[], fallback: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || places.length === 0) return fallback;
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5-mini",
        input: `Tu es Quivibe AI, un guide de sorties à Kinshasa. Réponds en français, en une phrase courte et chaleureuse. L'utilisateur cherche : "${query}". Propose ces adresses, sans en inventer : ${places.map((place) => `${place.name} (${place.category}, ${place.neighborhood})`).join(", ")}.`,
        max_output_tokens: 120,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return fallback;
    const text = outputText((await response.json()) as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> }).trim();
    return text || fallback;
  } catch {
    return fallback;
  }
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Décrivez votre envie en quelques mots." }, { status: 400 });
  const places = await prisma.place.findMany({
    where: { status: "APPROVED" },
    include: { categories: { take: 1, select: { category: { select: { name: true } } } }, media: { take: 1, select: { url: true, altText: true } }, reviews: { where: { status: "APPROVED" }, select: { rating: true } } },
    orderBy: { name: "asc" },
  });
  const serialized: QuivibePlace[] = places.map((place) => ({
    id: place.id, slug: place.slug, name: place.name, description: place.description, neighborhood: place.neighborhood, priceRange: place.priceRange, amenities: place.amenities,
    category: place.categories[0]?.category.name || "Établissement", rating: place.reviews.length ? place.reviews.reduce((sum, review) => sum + review.rating, 0) / place.reviews.length : null,
    image: place.media[0]?.url || null, imageAlt: place.media[0]?.altText || place.name, reservationsEnabled: place.reservationsEnabled,
  }));
  const recommendations = recommendPlaces(parsed.data.query, serialized);
  return NextResponse.json({ introduction: await enrichIntroduction(parsed.data.query, recommendations, defaultIntroduction(recommendations.length)), recommendations });
}
