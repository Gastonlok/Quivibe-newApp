"use client";

import { useState } from "react";
import { Loader2, Navigation } from "lucide-react";
import { trackPlaceInteraction } from "@/features/owner/components/place-interaction-tracker";

function directionsUrl(latitude: number, longitude: number, origin?: GeolocationCoordinates) {
  const parameters = new URLSearchParams({
    api: "1",
    destination: `${latitude},${longitude}`,
    travelmode: "driving",
  });

  if (origin) parameters.set("origin", `${origin.latitude},${origin.longitude}`);
  return `https://www.google.com/maps/dir/?${parameters.toString()}`;
}

export function DirectionsButton({
  latitude,
  longitude,
  placeName,
  placeId,
}: {
  latitude: number;
  longitude: number;
  placeName: string;
  placeId: string;
}) {
  const [isLocating, setIsLocating] = useState(false);
  const [message, setMessage] = useState("");

  function openDirections() {
    trackPlaceInteraction(placeId, "DIRECTIONS");
    const mapsWindow = window.open("about:blank", "_blank");
    if (mapsWindow) mapsWindow.opener = null;

    const navigate = (origin?: GeolocationCoordinates) => {
      const url = directionsUrl(latitude, longitude, origin);
      if (mapsWindow) mapsWindow.location.replace(url);
      else window.location.assign(url);
    };

    if (!navigator.geolocation) {
      setMessage("La geolocalisation n'est pas disponible sur cet appareil. Google Maps ouvre l'itineraire vers cet etablissement.");
      navigate();
      return;
    }

    setIsLocating(true);
    setMessage("Autorisez votre position pour calculer l'itineraire.");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        setMessage(`Itineraire vers ${placeName} ouvert dans Google Maps.`);
        navigate(position.coords);
      },
      () => {
        setIsLocating(false);
        setMessage("Position non autorisee. Google Maps ouvre l'itineraire vers cet etablissement.");
        navigate();
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={openDirections}
        disabled={isLocating}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-700 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-primary-800 disabled:cursor-wait disabled:opacity-70"
      >
        {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
        {isLocating ? "Recherche de votre position..." : "Itineraire"}
      </button>
      <p aria-live="polite" className="mt-2 min-h-5 text-xs leading-5 text-gray-500">
        {message}
      </p>
    </div>
  );
}
