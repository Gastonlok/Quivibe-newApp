import { notFound } from "next/navigation";
import { getPlaceBySlug } from "@/features/places/actions";
import { listFavoritesAction } from "@/features/favorites/actions";
import { FavoriteButton } from "@/features/favorites/components/favorite-button";
import { ReviewForm } from "@/features/reviews/components/review-form";
import { auth } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

const PRICE_LABELS: Record<number, string> = {
  1: "$",
  2: "$$",
  3: "$$$",
  4: "$$$$",
};

export default async function PlacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const place = await getPlaceBySlug(slug);

  if (!place) {
    notFound();
  }

  const session = await auth();

  // ✅ Récupérer la liste des favoris de l'utilisateur
  const favorites = await listFavoritesAction();

  // ✅ Vérifier si ce lieu est dans les favoris
  const isFavorite = Array.isArray(favorites) && favorites.some(
    (fav) => fav.placeId === place.id
  );

  const hasAlreadyReviewed = session?.user
   ? place.reviews.some(
      (review: { authorId: string }) =>
        review.authorId === session.user.id
    )
   : false;

  return (
    <main className="px-6 py-10 flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{place.name}</h1>
         <p className="text-gray-600 text-sm mt-1">
  {place.neighborhood} · {PRICE_LABELS[place.priceRange]} ·{" "}
  {place.categories
    .map((c: { category: { name: string } }) => c.category.name)
    .join(", ")}
</p>
        </div>
      <FavoriteButton
  placeId={place.id}
  initialFavorite={isFavorite}
/>
      </div>

      <p className="text-gray-800">{place.description}</p>

      <div className="text-sm text-gray-600 flex flex-col gap-1">
        <p>📍 {place.address}</p>
        {place.phone && <p>📞 {place.phone}</p>}
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Avis ({place.reviews.length})</h2>

        {place.reviews.length === 0 ? (
          <p className="text-gray-600 text-sm">
            Aucun avis pour le moment. Sois le premier à en laisser un !
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
  {place.reviews.map(
    (review: {
      id: string;
      author: {
        name: string;
      };
      rating: number;
    }) => (
      <li key={review.id} className="border rounded-lg p-3">
        <p className="text-sm font-medium">
          {review.author.name} — {review.rating}/5
        </p>

        {/* reste du contenu de la review */}
      </li>
    )
  )}
</ul>
        )}

        {session?.user && !hasAlreadyReviewed && (
          <ReviewForm placeId={place.id} />
        )}
        {!session?.user && (
          <p className="text-sm text-gray-600">
            Connecte-toi pour laisser un avis sur cet établissement.
          </p>
        )}
      </section>
    </main>
  );
}
