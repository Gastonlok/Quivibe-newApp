import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { defaultIntroduction, recommendPlaces } from "@/features/ai/recommend";
import { contextSchema, conversationalReply, normalize, updateContext } from "@/features/ai/conversation";
import { composeReply, interpretRequest } from "@/features/ai/model";
import type { QuivibePlace } from "@/features/ai/types";
import { bookingDate } from "@/features/ai/booking";
import { getAvailableSlotsAction } from "@/features/reservations/actions";

const requestSchema = z.object({
  query: z.string().trim().min(2).max(500),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2000) })).max(12).default([]),
  context: contextSchema.optional(),
  previousIds: z.array(z.string().max(100)).max(3).default([]),
  position: z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) }).optional(),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Décris ton envie en quelques mots (500 caractères maximum)." }, { status: 400 });
  const { query, history, previousIds, position } = parsed.data;
  let context = parsed.data.context || history.filter((m) => m.role === "user").reduce((c, m) => updateContext(m.content, c), contextSchema.parse({}));
  const simple = conversationalReply(query);
  if (simple) return NextResponse.json({ message: simple, context, recommendations: null });
  context = await interpretRequest(query, history, updateContext(query, context));
  if (context.nearby && !position && !context.neighborhood) return NextResponse.json({ message: "Tu es dans quel quartier ? Tu peux aussi utiliser le bouton « Près de moi ».", context, recommendations: null });
  if (!context.category && !context.occasion && !context.atmosphere.length && !context.amenities.length && !context.neighborhood && !context.nearby && !context.cuisine && !previousIds.length) return NextResponse.json({ message: "Tu imagines plutôt un repas ou un endroit où boire un verre ?", context, recommendations: null });
  try {
    // Only public fields needed for grounded discovery. Reservation capacity stays in the booking service.
    const places = await prisma.place.findMany({
      where: { status: "APPROVED" },
      select: { id: true, slug: true, name: true, description: true, neighborhood: true, priceRange: true, amenities: true, reservationsEnabled: true, maxPartySize: true, latitude: true, longitude: true,
        categories: { select: { category: { select: { name: true } } } },
        media: { take: 1, orderBy: { createdAt: "asc" }, select: { url: true, altText: true } },
        reviews: { where: { status: "APPROVED" }, select: { rating: true } },
      },
      orderBy: { name: "asc" },
    });
    const serialized: QuivibePlace[] = places.map((place) => ({
      id: place.id, slug: place.slug, name: place.name, description: place.description, neighborhood: place.neighborhood, priceRange: place.priceRange, amenities: place.amenities,
      category: place.categories.map((c) => c.category.name).join(", ") || "Établissement", rating: place.reviews.length ? place.reviews.reduce((sum, review) => sum + review.rating, 0) / place.reviews.length : null,
      image: place.media[0]?.url || null, imageAlt: place.media[0]?.altText || place.name, reservationsEnabled: place.reservationsEnabled, maxPartySize: place.maxPartySize, latitude: place.latitude, longitude: place.longitude,
    }));
    const q = normalize(query);
    const comparing = /lequel|laquelle|compar|meilleur|premier|deuxieme|troisieme/.test(q);
    const booking = /reserv/.test(q);
    let candidates = serialized;
    if ((comparing || booking) && previousIds.length) candidates = previousIds.flatMap((id) => serialized.filter((place) => place.id === id));
    const named = candidates.filter((p) => q.includes(normalize(p.name)));
    if ((comparing || booking) && named.length) candidates = named;
    const ordinal = /premier/.test(q) ? 0 : /deuxieme/.test(q) ? 1 : /troisieme/.test(q) ? 2 : -1;
    if ((comparing || booking) && ordinal >= 0) candidates = candidates[ordinal] ? [candidates[ordinal]] : [];
    if (context.nearby && position) {
      candidates = candidates.filter((p) => {
        const lat = (p.latitude! - position.latitude) * Math.PI / 180;
        const lon = (p.longitude! - position.longitude) * Math.PI / 180;
        const a = Math.sin(lat / 2) ** 2 + Math.cos(position.latitude * Math.PI / 180) * Math.cos(p.latitude! * Math.PI / 180) * Math.sin(lon / 2) ** 2;
        return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) <= 5;
      });
    }
    const recommendations = recommendPlaces(context, candidates);
    const date = bookingDate(context.date);
    if (date && context.partySize && /reserv|disponib/.test(q)) {
      for (const place of recommendations) {
        if (!place.reservationsEnabled) continue;
        const availability = await getAvailableSlotsAction({ placeId: place.id, date, partySize: context.partySize });
        const slot = availability.success ? availability.slots.find((time) => !context.time || time === context.time) : undefined;
        place.availableSlot = slot || null;
        place.reason += slot ? ` Créneau proposé le ${date} à ${slot} pour ${context.partySize} personnes, à revérifier lors de la validation.` : ` Aucun créneau vérifié pour cette demande ; consulte le formulaire pour les autres possibilités.`;
      }
    }
    let message = defaultIntroduction(recommendations.length);
    if (recommendations.length) {
      const first = recommendations[0];
      message = comparing ? `Je regarderais d’abord ${first.name} : ${first.reason}` : `${first.partialMatch ? "J’ai quelques pistes, avec des points à confirmer." : defaultIntroduction(recommendations.length)}\n\n${recommendations.map((p, i) => `${i + 1}. ${p.name} — ${p.reason}`).join("\n\n")}`;
      if (booking) message = recommendations.some((p) => p.reservationsEnabled) ? "Choisis « Réserver » sur l’adresse qui te plaît : le formulaire vérifiera les créneaux pour la date et le nombre de personnes choisis. La réservation sera envoyée uniquement après ta validation." : "Ces adresses ne proposent pas la réservation en ligne sur Quivibe. Tu peux ouvrir leur fiche pour les contacter.";
    }
    if (!booking) message = await composeReply(query, history, context, recommendations.map(({ name, reason, partialMatch }) => ({ name, reason, partialMatch })), message);
    if (context.nearby && position) message += "\n\nRecherche dans un rayon de 5 km à vol d’oiseau.";
    return NextResponse.json({ message, context, recommendations });
  } catch {
    return NextResponse.json({ error: "Je n’arrive pas à consulter les adresses pour le moment. Réessaie dans un instant." }, { status: 503 });
  }
}
