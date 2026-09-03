"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

const defaultIconPrototype = L.Icon.Default.prototype as L.Icon.Default & {
  _getIconUrl?: () => string;
};
delete defaultIconPrototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export interface LeafletPlace {
  id: string;
  slug: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  neighborhood: string;
  rating: number | null;
  image: string | null;
  imageAlt: string;
}

interface LeafletMapProps {
  places: LeafletPlace[];
  onSelectPlace: (place: LeafletPlace) => void;
  selectedPlace: LeafletPlace | null;
}

export default function LeafletMap({
  places,
  onSelectPlace,
  selectedPlace,
}: LeafletMapProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const selectRef = useRef(onSelectPlace);

  useEffect(() => {
    selectRef.current = onSelectPlace;
  }, [onSelectPlace]);

  useEffect(() => {
    if (!elementRef.current || mapRef.current) return;

    const map = L.map(elementRef.current, {
      center: [-4.325, 15.322],
      zoom: 12,
      zoomControl: true,
    });

    const tileUrl =
      process.env.NEXT_PUBLIC_MAP_TILE_URL ||
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    L.tileLayer(tileUrl, {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    const layer = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerRef.current = layer;

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    const bounds: L.LatLngTuple[] = [];

    for (const place of places) {
      const marker = L.marker([place.lat, place.lng]);
      marker.bindTooltip(place.name, { direction: "top", offset: [0, -8] });
      marker.on("click", () => selectRef.current(place));
      marker.addTo(layer);
      bounds.push([place.lat, place.lng]);
    }

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [42, 42], maxZoom: 14 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    }
  }, [places]);

  useEffect(() => {
    if (mapRef.current && selectedPlace) {
      mapRef.current.setView([selectedPlace.lat, selectedPlace.lng], 16, {
        animate: true,
      });
    }
  }, [selectedPlace]);

  return (
    <div
      ref={elementRef}
      className="h-[620px] w-full overflow-hidden rounded-3xl border border-gray-200 shadow-medium"
      aria-label="Carte des établissements Quivibe"
    />
  );
}
