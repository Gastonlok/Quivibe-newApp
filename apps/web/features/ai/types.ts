export type QuivibePlace = {
  id: string;
  slug: string;
  name: string;
  description: string;
  neighborhood: string;
  priceRange: number;
  category: string;
  rating: number | null;
  image: string | null;
  imageAlt: string;
  reservationsEnabled: boolean;
  amenities: string[];
  availableSlot?: string | null;
};

export type QuivibeRecommendation = QuivibePlace & { reason: string };
