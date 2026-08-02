import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listFavoritesAction } from "@/features/favorites/actions";
import { PlaceCard } from "@/features/places/components/place-card";

export default async function FavoritesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const places = await listFavoritesAction();

  return (
    <main className="px-6 py-10 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Mes favoris</h1>
        <p className="text-gray-600 text-sm mt-1">
          {places.length} établissement{places.length > 1 ? "s" : ""}{" "}
          sauvegardé{places.length > 1 ? "s" : ""}
        </p>
      </div>

      {places.length === 0 ? (
        <p className="text-gray-600">
          Tu n&apos;as pas encore de favoris. Explore la{" "}
          <a href="/" className="underline">
            page de découverte
          </a>{" "}
          pour en ajouter.
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
