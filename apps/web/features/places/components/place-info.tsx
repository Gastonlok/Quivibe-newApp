// apps/web/features/places/components/place-info.tsx
interface PlaceInfoProps {
  place: {
    priceRange: number;
    // Ajoutez d'autres champs si nécessaire
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
        {/* Ajoutez d'autres infos ici */}
      </div>
    </section>
  );
}
