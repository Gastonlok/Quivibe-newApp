import { listPlacesAction } from "@/features/places/actions";
import { PlaceCard } from "@/features/places/components/place-card";

type SearchParams = {
  search?: string;
  neighborhood?: string;
  priceRange?: string;
  page?: string;
};

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const result = await listPlacesAction({
    search: params.search,
    neighborhood: params.neighborhood,
    priceRange: params.priceRange,
    page: params.page,
  });

  if (!result.success) {
    return <p className="px-6 py-10 text-red-600">{result.error}</p>;
  }

  const { places, total } = result.data;

  return (
    <main className="px-6 py-10 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Où sort-on ce soir ?</h1>
        <p className="text-gray-600 text-sm mt-1">
          {total} établissement{total > 1 ? "s" : ""} à découvrir à Kinshasa
        </p>
      </div>

      <form className="flex gap-2" method="GET">
        <input
          type="text"
          name="search"
          defaultValue={params.search}
          placeholder="Rechercher un lieu, une ambiance..."
          className="border rounded-md px-3 py-2 flex-1"
        />
        <button type="submit" className="border rounded-md px-4 py-2">
          Rechercher
        </button>
      </form>

      {places.length === 0 ? (
        <p className="text-gray-600">
          Aucun établissement ne correspond à ta recherche pour le moment.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {places.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      )}
    </main>
  );
}
