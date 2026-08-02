"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

// ✅ Import du CSS avec une syntaxe simple
// Note: Si l'erreur persiste, utilisez cette ligne avec un commentaire TypeScript
// @ts-ignore
import "leaflet/dist/leaflet.css";

// Configuration des icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface PlaceMapProps {
  latitude: number;
  longitude: number;
  name: string;
}

export function PlaceMap({ latitude, longitude, name }: PlaceMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = L.map(mapRef.current).setView([latitude, longitude], 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    L.marker([latitude, longitude])
      .addTo(map)
      .bindPopup(name);

    return () => {
      map.remove();
    };
  }, [latitude, longitude, name]);

  return <div ref={mapRef} className="w-full h-full" />;
}
