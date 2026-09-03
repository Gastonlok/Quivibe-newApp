"use client";

import { useEffect, useRef } from "react";
import type L from "leaflet";

interface PlaceMapProps {
  latitude: number;
  longitude: number;
  name: string;
}

export function PlaceMap({ latitude, longitude, name }: PlaceMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let map: L.Map | undefined;

    async function createMap() {
      const { default: leaflet } = await import("leaflet");
      if (disposed || !mapRef.current) return;

      delete (leaflet.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: () => string })._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      map = leaflet.map(mapRef.current).setView([latitude, longitude], 15);
      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "OpenStreetMap contributors",
        })
        .addTo(map);

      leaflet.marker([latitude, longitude]).addTo(map).bindPopup(name);
    }

    void createMap();

    return () => {
      disposed = true;
      map?.remove();
    };
  }, [latitude, longitude, name]);

  return <div ref={mapRef} className="h-full w-full" />;
}
