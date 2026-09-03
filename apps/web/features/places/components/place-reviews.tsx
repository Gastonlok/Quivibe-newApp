// apps/web/features/places/components/place-reviews.tsx
import { Star } from "lucide-react";
import { getPlaceReviews } from "../actions";
import { ReviewReportButton } from "@/features/reviews/components/review-report-button";
import { ReviewForm } from "@/features/reviews/components/review-form";

export async function PlaceReviews({ placeId }: { placeId: string }) {
  const reviews = await getPlaceReviews(placeId);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">Communauté</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-950">
            Avis {reviews.length > 0 ? `(${reviews.length})` : ""}
          </h2>
        </div>
        <a href="#laisser-un-avis" className="rounded-full bg-primary-600 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-primary-700">
          Laisser un avis
        </a>
      </div>

      <div id="laisser-un-avis" className="scroll-mt-28 rounded-3xl border border-primary-100 bg-primary-50/50 p-4 sm:p-6">
        <p className="mb-4 text-sm font-semibold text-gray-700">Partagez votre expérience. Votre avis sera publié après validation.</p>
        <ReviewForm placeId={placeId} />
      </div>

      {reviews.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-gray-600">
          Aucun avis pour le moment. Soyez le premier à donner votre avis !
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-extrabold text-gray-900">{review.author.name}</p>
                  <div className="mt-1 flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-sm text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
              <p className="mt-3 text-gray-700">{review.comment}</p>
              {review.response && (
                <div className="mt-3 rounded-xl border-l-4 border-primary-500 bg-primary-50 p-3 text-sm text-gray-700">
                  <p className="font-bold text-gray-900">Réponse de {review.response.author.name}</p>
                  <p className="mt-1">{review.response.body}</p>
                </div>
              )}
              <div className="mt-3"><ReviewReportButton reviewId={review.id} /></div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
