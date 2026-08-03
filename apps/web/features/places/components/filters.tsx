"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

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
  { name: "Restaurant", slug: "restaurant", icon: "🍽️" },
  { name: "Bar", slug: "bar", icon: "🍸" },
  { name: "Lounge", slug: "lounge", icon: "🛋️" },
  { name: "Rooftop", slug: "rooftop", icon: "🌅" },
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
    <div className="flex flex-wrap items-center gap-2">
      {/* Filtre Catégorie */}
      <motion.select
        value={currentCategory}
        onChange={(e) => handleFilter("category", e.target.value)}
        className="px-4 py-2 rounded-full border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <option value="">🏷️ Toutes les catégories</option>
        {CATEGORIES.map((cat) => (
          <option key={cat.slug} value={cat.slug}>
            {cat.icon} {cat.name}
          </option>
        ))}
      </motion.select>

      {/* Filtre Quartier */}
      <motion.select
        value={currentNeighborhood}
        onChange={(e) => handleFilter("neighborhood", e.target.value)}
        className="px-4 py-2 rounded-full border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <option value="">📍 Tous les quartiers</option>
        {NEIGHBORHOODS.map((hood) => (
          <option key={hood} value={hood}>
            {hood}
          </option>
        ))}
      </motion.select>

      {/* Bouton Réinitialiser */}
      {(currentCategory || currentNeighborhood) && (
        <motion.button
          onClick={() => {
            const params = new URLSearchParams(searchParams);
            params.delete("category");
            params.delete("neighborhood");
            router.push(`/?${params.toString()}`);
          }}
          className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-sm text-gray-600 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          ✕ Réinitialiser
        </motion.button>
      )}
    </div>
  );
}
