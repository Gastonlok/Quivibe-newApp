// apps/web/features/places/components/filters.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";

const NEIGHBORHOODS = [
  "Gombe",
  "Kinshasa",
  "Lemba",
  "Limete",
  "Matete",
  "Mont Ngafula",
  "Ndjili",
  "Selembao",
];

const CATEGORIES = [
  { name: "Restaurant", slug: "restaurant" },
  { name: "Bar", slug: "bar" },
  { name: "Lounge", slug: "lounge" },
  { name: "Rooftop", slug: "rooftop" },
];

export function Filters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/?${params.toString()}`);
  };

  const currentCategory = searchParams.get("category") || "";
  const currentNeighborhood = searchParams.get("neighborhood") || "";

  return (
    <div className="flex flex-wrap gap-2">
      <select
        value={currentCategory}
        onChange={(e) => handleFilter("category", e.target.value)}
        className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm"
      >
        <option value="">Toutes les catégories</option>
        {CATEGORIES.map((cat) => (
          <option key={cat.slug} value={cat.slug}>
            {cat.name}
          </option>
        ))}
      </select>

      <select
        value={currentNeighborhood}
        onChange={(e) => handleFilter("neighborhood", e.target.value)}
        className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm"
      >
        <option value="">Tous les quartiers</option>
        {NEIGHBORHOODS.map((hood) => (
          <option key={hood} value={hood}>
            {hood}
          </option>
        ))}
      </select>
    </div>
  );
}
