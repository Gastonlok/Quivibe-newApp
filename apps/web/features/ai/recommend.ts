import type { QuivibePlace, QuivibeRecommendation } from "./types";
import { AMENITY_LABELS } from "@/features/places/amenities";

const budgetWords = ["pas cher", "abordable", "petit budget", "economique", "économique"];
const premiumWords = ["chic", "luxe", "haut de gamme", "premium", "romantique", "date"];
const livelyWords = ["sortir", "soir", "fete", "fête", "ambiance", "musique", "bar", "amis"];
const amenityMatchers = [
  { amenity: "BILLIARD", pattern: /b+illard/ },
  { amenity: "POOL", pattern: /piscine|pool/ },
  { amenity: "KARAOKE", pattern: /karaoke/ },
  { amenity: "PARKING", pattern: /parking/ },
  { amenity: "TERRACE", pattern: /terrasse/ },
  { amenity: "WIFI", pattern: /wi-?fi|internet/ },
  { amenity: "LIVE_MUSIC", pattern: /musique live|concert/ },
] as const;

function normalized(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function recommendPlaces(query: string, places: QuivibePlace[]): QuivibeRecommendation[] {
  const request = normalized(query);
  const words = request.split(/[^a-z0-9]+/).filter((word) => word.length > 2);
  const wantsBudget = budgetWords.some((word) => request.includes(normalized(word)));
  const wantsPremium = premiumWords.some((word) => request.includes(normalized(word)));
  const wantsLively = livelyWords.some((word) => request.includes(normalized(word)));
  const requestedAmenity = amenityMatchers.find(({ pattern }) => pattern.test(request))?.amenity;

  return places
    .filter((place) => !requestedAmenity || place.amenities.includes(requestedAmenity))
    .map((place) => {
      const searchable = normalized(`${place.name} ${place.description} ${place.category} ${place.neighborhood}`);
      let score = (place.rating || 0) * 3 + (place.reservationsEnabled ? 1 : 0);
      score += words.filter((word) => searchable.includes(word)).length * 8;
      if (wantsBudget) score += Math.max(0, 5 - place.priceRange) * 2;
      if (wantsPremium) score += place.priceRange * 2;
      if (wantsLively && /bar|lounge|club|rooftop|musique|night/.test(searchable)) score += 6;
      if (requestedAmenity && place.amenities.includes(requestedAmenity)) score += 30;

      const reason = requestedAmenity && place.amenities.includes(requestedAmenity)
        ? `${AMENITY_LABELS[requestedAmenity]} disponible dans cet établissement.`
        : words.some((word) => normalized(place.category).includes(word))
        ? `Une option ${place.category.toLowerCase()} qui correspond à votre envie.`
        : wantsBudget && place.priceRange <= 2
          ? "Une option adaptée à un budget maîtrisé."
          : wantsPremium && place.priceRange >= 3
            ? "Une adresse plus soignée pour une sortie spéciale."
            : place.rating
              ? `Très bien noté par la communauté (${place.rating.toFixed(1)}/5).`
              : `À découvrir du côté de ${place.neighborhood}.`;

      return { ...place, score, reason };
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "fr"))
    .slice(0, 3)
    .map(({ score: _score, ...place }) => place);
}

export function defaultIntroduction(count: number) {
  return count === 0 ? "Je n’ai pas encore trouvé d’adresse qui corresponde exactement à cette envie. Essayez une autre ambiance ou un autre quartier." : `Voici ${count === 1 ? "une adresse" : `${count} adresses`} qui devraient vous plaire.`;
}
