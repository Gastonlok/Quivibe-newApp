import type { QuivibePlace, QuivibeRecommendation } from "./types";
import { normalize, updateContext, type SearchContext } from "./conversation";
import { AMENITY_LABELS } from "../places/amenities";

const evidence: Record<string, RegExp> = {
  calme: /calme|tranquille|paisible|cosy|reposant/,
  animé: /anime|festif|dansant|musique|concert/,
  chic: /chic|elegant|raffine|luxueux|haut de gamme/,
  vue: /vue|panorama/,
  photos: /photogenique|instagram|photos/,
  romantique: /romantique|amoureux|intimiste/,
  anniversaire: /anniversaire|celebration|evenement prive/,
  amis: /convivial|amis|groupe/,
  famille: /familial|famille|enfants/,
  professionnel: /reunion|affaires|professionnel/,
  detente: /detente|relax|repos|calme/,
};

function hasEvidence(description: string, pattern: RegExp) {
  return description.split(/[.!?;\n]/).some((sentence) => pattern.test(sentence) && !/\b(pas|sans|aucun|non|ni)\b/.test(sentence));
}

const evidenceLabels: Record<string, string> = {
  calme: "un cadre calme", animé: "une ambiance animée", chic: "un cadre élégant",
  vue: "une vue", photos: "un cadre pour les photos", romantique: "un cadre romantique",
  anniversaire: "des célébrations", amis: "un cadre convivial", famille: "un accueil familial",
  professionnel: "des sorties professionnelles", detente: "un cadre propice à la détente",
};

export function recommendPlaces(query: string | SearchContext, places: QuivibePlace[]): QuivibeRecommendation[] {
  const context = typeof query === "string" ? updateContext(query) : query;
  return places.map((place) => {
    const description = normalize(place.description);
    const text = normalize(`${place.name} ${place.description} ${place.category}`);
    const reasons: string[] = [];
    const missing: string[] = [];
    // Location, category and declared facilities are requirements, not popularity boosts.
    if (context.neighborhood && !normalize(place.neighborhood).includes(normalize(context.neighborhood))) return null;
    if (context.category && !normalize(place.category).includes(normalize(context.category))) return null;
    if (context.budget === "low" && place.priceRange > 2) return null;
    if (context.budget === "medium" && place.priceRange > 3) return null;
    if (context.amenities.some((a) => !place.amenities.includes(a))) return null;
    let score = 0;
    for (const mood of [...context.atmosphere, ...(context.occasion ? [context.occasion] : [])]) {
      if (evidence[mood] && hasEvidence(description, evidence[mood])) { reasons.push(`la description mentionne ${evidenceLabels[mood]}`); score += 10; }
      else missing.push(mood);
    }
    if (context.cuisine) {
      if (text.includes(normalize(context.cuisine).replace(/e$/, ""))) { score += 10; reasons.push(`la description mentionne une cuisine ${context.cuisine}`); }
      else missing.push(`cuisine ${context.cuisine}`);
    }
    if (context.neighborhood) reasons.push(`à ${place.neighborhood}`);
    if (context.budget && context.budget !== "any") reasons.push(`gamme de prix ${"$".repeat(place.priceRange)}`);
    for (const amenity of context.amenities) reasons.push(AMENITY_LABELS[amenity as keyof typeof AMENITY_LABELS] || amenity);
    if (context.partySize && place.maxPartySize !== undefined && context.partySize > place.maxPartySize) missing.push(`réservation en ligne pour ${context.partySize} personnes`);
    if (context.amount) missing.push(`budget exact de ${context.amount} (la gamme de prix ne permet pas de le garantir)`);
    if (context.date || context.time) missing.push("disponibilité à vérifier dans le formulaire de réservation");
    missing.push(...context.constraints.map((item) => `${item} à vérifier`));
    if (!reasons.length) reasons.push(`${place.category} à ${place.neighborhood}`);
    return { ...place, score, missing, reason: `${reasons.join(" ; ")}.${missing.length ? ` À confirmer : ${missing.join(", ")}.` : ""}` };
  }).filter((place) => place !== null)
    .sort((a, b) => a.missing.length - b.missing.length || b.score - a.score || (b.rating || 0) - (a.rating || 0) || a.name.localeCompare(b.name, "fr"))
    .filter((place, _, all) => place.missing.length === all[0].missing.length)
    .slice(0, 3)
    .map(({ score: _score, missing, ...place }) => ({ ...place, partialMatch: missing.length > 0 }));
}

export function defaultIntroduction(count: number) {
  return count === 0 ? "Je n’ai pas trouvé de lieu réunissant ces critères sur Quivibe. Tu préfères élargir le quartier ou revoir un autre critère ?" : `J’ai ${count === 1 ? "une adresse" : `${count} adresses`} à te proposer.`;
}
