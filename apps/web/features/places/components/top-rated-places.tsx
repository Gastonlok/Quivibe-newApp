"use client";

import { useEffect, useState } from "react";
import { PlaceCard } from "./place-card";
import { getTopRatedPlaces } from "../actions";

export function TopRatedPlaces() {
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    getTopRatedPlaces().then(setPlaces);
  }, []);

  if (places.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Chargement des meilleurs établissements...</p>
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
