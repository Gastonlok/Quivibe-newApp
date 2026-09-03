export const AMENITY_VALUES = [
  "BILLIARD",
  "POOL",
  "KARAOKE",
  "PARKING",
  "TERRACE",
  "WIFI",
  "LIVE_MUSIC",
  "AIR_CONDITIONING",
  "PRIVATE_ROOM",
] as const;

export type Amenity = (typeof AMENITY_VALUES)[number];

export const AMENITY_LABELS: Record<Amenity, string> = {
  BILLIARD: "Billard",
  POOL: "Piscine",
  KARAOKE: "Karaoké",
  PARKING: "Parking",
  TERRACE: "Terrasse",
  WIFI: "Wi-Fi",
  LIVE_MUSIC: "Musique live",
  AIR_CONDITIONING: "Climatisation",
  PRIVATE_ROOM: "Espace privé",
};
