import { notFound } from "next/navigation";
import { getPlaceBySlugAction } from "@/features/places/actions";

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
  const place = await getPlaceBySlugAction(slug);

  if (!place) {
    notFound();
  }

  return (
    <main className="px-6 py-10 flex flex-col gap-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">{place.name}</h1>
        <p className="text-gray-600 text-sm mt-1">
          {place.neighborhood} · {PRICE_LABELS[place.priceRange]} ·{" "}
          {place.categories.map((c) => c.category.name).join(", ")}
        </p>
      </div>

      <p className="text-gray-800">{place.description}</p>

      <div className="text-sm text-gray-600 flex flex-col gap-1">
        <p>📍 {place.address}</p>
        {place.phone && <p>📞 {place.phone}</p>}
      </div>

      <section>
        <h2 className="text-lg font-medium mb-3">
          Avis ({place.reviews.length})
        </h2>
        {place.reviews.length === 0 ? (
          <p className="text-gray-600 text-sm">
            Aucun avis pour le moment. Sois le premier à en laisser un !
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {place.reviews.map((review) => (
              <li key={review.id} className="border rounded-lg p-3">
                <p className="text-sm font-medium">
                  {review.author.name} — {review.rating}/5
                </p>
                <p className="text-sm text-gray-700 mt-1">{review.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
