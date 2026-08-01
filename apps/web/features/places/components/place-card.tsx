import Link from "next/link";
import type { Place } from "@prisma/client";

const PRICE_LABELS: Record<number, string> = {
  1: "$",
  2: "$$",
  3: "$$$",
  4: "$$$$",
};

export function PlaceCard({ place }: { place: Place }) {
  return (
    <Link
      href={`/etablissements/${place.slug}`}
      className="flex gap-3 border rounded-xl p-3 hover:bg-gray-50 transition"
    >
      <div className="w-16 h-16 rounded-lg bg-gray-200 flex-shrink-0" />
      <div className="min-w-0">
        <p className="font-medium truncate">{place.name}</p>
        <p className="text-sm text-gray-600 truncate">
          {place.neighborhood} · {PRICE_LABELS[place.priceRange]}
        </p>
      </div>
    </Link>
  );
}
