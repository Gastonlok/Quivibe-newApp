// apps/web/features/places/components/place-reviews.tsx
import { Star } from "lucide-react";
import { getPlaceReviews } from "../actions";

export async function PlaceReviews({ placeId }: { placeId: string }) {
  const reviews = await getPlaceReviews(placeId);

  if (reviews.length === 0) {
    return (
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Avis
        </h2>
        <p className="text-gray-500 italic">
          Aucun avis pour le moment. Soyez le premier à donner votre avis !
        </p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Avis ({reviews.length})
      </h2>
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white p-4 rounded-lg border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {review.author.name}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <span className="text-sm text-gray-400">
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-700 mt-2">{review.comment}</p>
            {review.response && (
              <div className="mt-3 rounded-lg border-l-4 border-primary-500 bg-primary-50 p-3 text-sm text-gray-700">
                <p className="font-bold text-gray-900">Reponse de {review.response.author.name}</p>
                <p className="mt-1">{review.response.body}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
