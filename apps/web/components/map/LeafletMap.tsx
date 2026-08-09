"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Configuration des icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Place {
  id: number;
  name: string;
  lat: number;
  lng: number;
  category: string;
  rating: number;
}

interface LeafletMapProps {
  places: Place[];
  onSelectPlace: (place: Place) => void;
  selectedPlace: Place | null;
}

export default function LeafletMap({ places, onSelectPlace, selectedPlace }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Initialisation de la carte
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const mapInstance = L.map(mapRef.current, {
      center: [-4.33, 15.32],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapInstance);

    // Ajouter les marqueurs
    places.forEach((place) => {
      const marker = L.marker([place.lat, place.lng])
        .addTo(mapInstance)
        .bindPopup(`
          <div class="p-2">
            <h4 class="font-bold text-gray-900">${place.name}</h4>
            <p class="text-sm text-gray-600">${place.category}</p>
            <p class="text-sm text-yellow-500">⭐ ${place.rating}</p>
            <a href="/places/${place.id}" class="text-primary-500 text-sm hover:underline">Voir détails</a>
          </div>
        `);

      marker.on("click", () => {
        onSelectPlace(place);
      });
    });

    mapInstanceRef.current = mapInstance;

    return () => {
      mapInstance.remove();
      mapInstanceRef.current = null;
    };
  }, [places, onSelectPlace]);

  // Zoom sur le lieu sélectionné
  useEffect(() => {
    if (mapInstanceRef.current && selectedPlace) {
      mapInstanceRef.current.setView([selectedPlace.lat, selectedPlace.lng], 16, {
        animate: true,
        duration: 1,
      });
    }
  }, [selectedPlace]);

  return <div ref={mapRef} className="w-full h-[600px] rounded-2xl overflow-hidden shadow-lg border border-gray-200" />;
}
