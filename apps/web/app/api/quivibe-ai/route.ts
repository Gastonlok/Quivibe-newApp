import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { defaultIntroduction, recommendPlaces } from "@/features/ai/recommend";
import { parseReservationIntent } from "@/features/ai/reservation-intent";
import type { QuivibePlace } from "@/features/ai/types";

const requestSchema = z.object({
  query: z.string().trim().min(2).max(500),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(1_000) })).max(8).optional(),
});

function outputText(response: { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> }) {
  return response.output?.flatMap((item) => item.content || []).filter((item) => item.type === "output_text").map((item) => item.text || "").join("") || "";
}

function toKinshasaDate(date: string, time: string) {
  return new Date(`${date}T${time}:00+01:00`);
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function availableSlot(
  place: { id: string; reservationsEnabled: boolean; reservationCapacity: number; reservationDuration: number; maxPartySize: number; reservationStartTime: string; reservationEndTime: string; reservationInterval: number },
  reservations: { placeId: string; dateTime: Date; partySize: number }[],
  intent: NonNullable<ReturnType<typeof parseReservationIntent>>,
) {
  if (!place.reservationsEnabled || intent.partySize > place.maxPartySize) return null;
  const slots: string[] = [];
  for (let minutes = timeToMinutes(place.reservationStartTime); minutes + place.reservationDuration <= timeToMinutes(place.reservationEndTime); minutes += place.reservationInterval) {
    slots.push(minutesToTime(minutes));
  }
  const orderedSlots = intent.requestedTime ? slots.filter((slot) => slot >= intent.requestedTime!) : slots;
  for (const time of orderedSlots) {
    const dateTime = toKinshasaDate(intent.date, time);
    if (dateTime.getTime() < Date.now() + 60 * 60_000) continue;
    const occupied = reservations
      .filter((reservation) => reservation.placeId === place.id && Math.abs(reservation.dateTime.getTime() - dateTime.getTime()) < place.reservationDuration * 60_000)
      .reduce((sum, reservation) => sum + reservation.partySize, 0);
    if (occupied + intent.partySize <= place.reservationCapacity) return time;
  }
  return null;
}

function localMessage(query: string, places: QuivibePlace[]) {
  if (places.length === 0) return "Je n’ai pas trouvé d’adresse qui corresponde exactement à cette demande pour le moment. Essayez de préciser le quartier, le budget ou une autre ambiance, et je relancerai la recherche.";
  const names = places.map((place) => place.name).join(", ");
  return `Pour ${query.toLowerCase()}, je te suggère ${names}. J’ai privilégié les lieux qui correspondent à ton envie, à leur ambiance et aux informations déclarées par les établissements. Ouvre une fiche pour voir les photos, les équipements et réserver si tu trouves ta vibe.`;
}

async function enrichMessage(query: string, history: { role: "user" | "assistant"; content: string }[], places: QuivibePlace[], fallback: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || places.length === 0) return fallback;
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5-mini",
        input: `Tu es Quivibe AI, un guide de sorties à Kinshasa. Réponds en français de manière chaleureuse, précise et conversationnelle, en 2 à 4 phrases courtes. Ne propose jamais une adresse qui n'est pas dans la liste. Prends en compte l'historique : ${history.map((message) => `${message.role === "user" ? "Client" : "Quivibe AI"}: ${message.content}`).join(" | ")}. Nouvelle demande : "${query}". Adresses disponibles : ${places.map((place) => `${place.name} (${place.category}, ${place.neighborhood}, budget ${place.priceRange}/4, équipements: ${place.amenities.join(", ") || "non renseignés"})`).join("; ")}.`,
        max_output_tokens: 260,
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
  const intent = parseReservationIntent(parsed.data.query);
  const places = await prisma.place.findMany({
    where: { status: "APPROVED" },
    include: { categories: { take: 1, select: { category: { select: { name: true } } } }, media: { take: 1, select: { url: true, altText: true } }, reviews: { where: { status: "APPROVED" }, select: { rating: true } } },
    orderBy: { name: "asc" },
  });
  const reservations = intent
    ? await prisma.reservation.findMany({
        where: {
          placeId: { in: places.map((place) => place.id) },
          status: { in: ["PENDING", "CONFIRMED"] },
          dateTime: {
            gte: toKinshasaDate(intent.date, "00:00"),
            lt: new Date(toKinshasaDate(intent.date, "00:00").getTime() + 24 * 60 * 60_000),
          },
        },
        select: { placeId: true, dateTime: true, partySize: true },
      })
    : [];
  const serialized: QuivibePlace[] = places.map((place) => ({
    id: place.id, slug: place.slug, name: place.name, description: place.description, neighborhood: place.neighborhood, priceRange: place.priceRange, amenities: place.amenities,
    category: place.categories[0]?.category.name || "Établissement", rating: place.reviews.length ? place.reviews.reduce((sum, review) => sum + review.rating, 0) / place.reviews.length : null,
    image: place.media[0]?.url || null, imageAlt: place.media[0]?.altText || place.name, reservationsEnabled: place.reservationsEnabled,
    availableSlot: intent ? availableSlot(place, reservations, intent) : null,
  }));
  const recommendations = recommendPlaces(parsed.data.query, serialized);
  const fallback = recommendations.length ? localMessage(parsed.data.query, recommendations) : defaultIntroduction(0);
  return NextResponse.json({ message: await enrichMessage(parsed.data.query, parsed.data.history || [], recommendations, fallback), recommendations });
}
