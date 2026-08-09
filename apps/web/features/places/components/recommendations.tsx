"use client";

import { useEffect, useState } from "react";
import { PlaceCard } from "./place-card";
import { getRecommendations } from "../actions";
import type { PlaceWithFavorites } from "../actions"; // ✅ Importer le type

export function Recommendations() {
  const [places, setPlaces] = useState<PlaceWithFavorites[]>([]); // ✅ Typer explicitement
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecommendations()
      .then((data) => {
        setPlaces(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erreur:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <PlaceListSkeleton />;
  }

  if (places.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Aucune recommandation pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {places.map((place) => (
        <PlaceCard key={place.id} place={place} />
      ))}
    </div>
  );
}

function PlaceListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-200 h-56 rounded-t-xl"></div>
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
