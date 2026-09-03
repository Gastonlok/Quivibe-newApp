import { AMENITY_LABELS, type Amenity } from "@/features/places/amenities";

interface PlaceInfoProps {
  place: {
    priceRange: number;
    amenities: string[];
  };
}

export function PlaceInfo({ place }: PlaceInfoProps) {
  const priceLabels = ["€", "€€", "€€€", "€€€€"];

  return (
    <section className="bg-gray-50 rounded-xl p-6">
      <h3 className="font-semibold text-gray-900 mb-4">
        Informations pratiques
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Budget</p>
          <p className="font-medium">
            {priceLabels.slice(0, place.priceRange).join(" ")}
          </p>
        </div>
        {place.amenities.length > 0 && (
          <div className="md:col-span-2">
            <p className="text-sm text-gray-500">Équipements</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {place.amenities.map((amenity) => (
                <span key={amenity} className="rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-800">
                  {AMENITY_LABELS[amenity as Amenity] || amenity}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
