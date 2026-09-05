import { z } from "zod";

export const contextSchema = z.object({
  category: z.string().max(80).nullable().default(null),
  neighborhood: z.string().max(80).nullable().default(null),
  budget: z.enum(["low", "medium", "any"]).nullable().default(null),
  amount: z.string().max(40).nullable().default(null),
  occasion: z.string().max(100).nullable().default(null),
  atmosphere: z.array(z.string().max(60)).max(8).default([]),
  cuisine: z.string().max(80).nullable().default(null),
  amenities: z.array(z.string().max(40)).max(12).default([]),
  partySize: z.number().int().min(1).max(100).nullable().default(null),
  date: z.string().max(60).nullable().default(null),
  time: z.string().max(40).nullable().default(null),
  nearby: z.boolean().default(false),
  constraints: z.array(z.string().max(100)).max(8).default([]),
});
export type SearchContext = z.infer<typeof contextSchema>;
export type ChatMessage = { role: "user" | "assistant"; content: string };
export const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Also works without a model: each turn updates only the preferences it mentions.
export function updateContext(query: string, previous?: SearchContext): SearchContext {
  const q = normalize(query);
  const c = contextSchema.parse(/nouvelle recherche|recommencons|oublie (tout|mes criteres)/.test(q) ? {} : previous || {});
  if (/pas (trop )?cher|petit budget|abordable|raisonnable|economique|pas hors de prix/.test(q)) c.budget = "low";
  if (/prix moyen|budget moyen/.test(q)) c.budget = "medium";
  if (/peu importe le prix|sans limite de budget/.test(q)) { c.budget = "any"; c.amount = null; }
  const amount = q.match(/\d+(?:[.,]\d+)?\s*(?:\$|dollars?|usd|cdf|francs?)/)?.[0];
  if (amount) c.amount = amount;
  const category = q.match(/\b(restaurant|resto|bar|rooftop|hotel|lounge|club)\b/)?.[1];
  if (category) c.category = category === "resto" ? "restaurant" : category;
  if (/boire un verre/.test(q)) c.category = "bar";
  const area = q.match(/\b(gombe|limete|ngaliema|bandalungwa|bandal|kintambo|lingwala|lemba|matete|masina|kinshasa)\b/)?.[1];
  if (area) { c.neighborhood = area === "bandal" ? "bandalungwa" : area; c.nearby = false; }
  if (/pres de moi|a proximite/.test(q)) c.nearby = true;
  if (/partout|tous les quartiers|peu importe le quartier/.test(q)) { c.neighborhood = null; c.nearby = false; }
  if (/copine|copain|romantique|\bdate\b|en amoureux/.test(q)) c.occasion = "romantique";
  for (const occasion of ["anniversaire", "amis", "famille", "professionnel", "detente"]) if (q.includes(occasion)) c.occasion = occasion;
  const moods: [RegExp, string][] = [[/calme|tranquille|pose|cosy/, "calme"], [/anime|festif/, "animé"], [/chic|classe|elegant|impressionner/, "chic"], [/belle vue|panorama/, "vue"], [/photos|instagram/, "photos"]];
  for (const [pattern, mood] of moods) if (pattern.test(q)) {
    c.atmosphere = c.atmosphere.filter((x) => x !== mood && !(mood === "calme" && x === "animé") && !(mood === "animé" && x === "calme"));
    c.atmosphere.push(mood);
  }
  const cuisine = q.match(/\b(africain|congolais|italien|chinois|japonais|libanais|vegetarien)\w*/)?.[0];
  if (cuisine) c.cuisine = cuisine;
  const party = q.match(/(?:on est|nous sommes|pour)\s+(\d{1,2})\b/);
  if (party && Number(party[1]) > 0) c.partySize = Number(party[1]);
  const date = q.match(/\d{4}-\d{2}-\d{2}|demain|aujourd'hui|ce soir|ce week[ -]?end/)?.[0];
  if (date) c.date = date;
  const time = q.match(/\b([01]?\d|2[0-3])(?:h|:)([0-5]\d)?\b/);
  if (time) c.time = `${time[1].padStart(2, "0")}:${time[2] || "00"}`;
  const amenities: [RegExp, string][] = [[/billard/, "BILLIARD"], [/piscine/, "POOL"], [/karaoke/, "KARAOKE"], [/parking/, "PARKING"], [/terrasse/, "TERRACE"], [/wi-?fi/, "WIFI"], [/musique live|concert/, "LIVE_MUSIC"]];
  for (const [pattern, amenity] of amenities) if (pattern.test(q) && !c.amenities.includes(amenity)) c.amenities.push(amenity);
  return c;
}

export function conversationalReply(query: string): string | null {
  const q = normalize(query).replace(/[!?.,]/g, "").trim();
  if (/^(bonjour|salut|hello|coucou|bonsoir)( quivibe)?$/.test(q)) return "Salut ! Quelle sortie te ferait plaisir ?";
  if (/^(merci( beaucoup| bien| a toi)?|super|parfait|ok|d'accord)$/.test(q)) return "Avec plaisir ! Je suis là si tu veux affiner ton choix.";
  if (/^(qui es.tu|que peux.tu faire|tu fais quoi)$/.test(q)) return "Je t’aide à choisir où sortir sur Quivibe, selon tes envies. Tu as une idée de sortie en tête ?";
  return null;
}
