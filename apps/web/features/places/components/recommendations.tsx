"use client";

import { useEffect, useState } from "react";
import { PlaceCard } from "./place-card";
import { getRecommendations } from "../actions";

export function Recommendations() {
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    getRecommendations().then(setPlaces);
  }, []);

  if (places.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Chargement des recommandations...</p>
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
