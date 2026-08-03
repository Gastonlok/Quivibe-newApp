"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Search, X, Navigation, Layers, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

// Import Leaflet
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Configuration des icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Données mock pour la carte
const MOCK_PLACES = [
  { id: 1, name: "Le Jardin des Saveurs", lat: -4.325, lng: 15.325, category: "Restaurant", rating: 4.8 },
  { id: 2, name: "Sky Lounge", lat: -4.318, lng: 15.312, category: "Lounge", rating: 4.5 },
  { id: 3, name: "Chez Maman African", lat: -4.385, lng: 15.318, category: "Restaurant", rating: 4.7 },
  { id: 4, name: "The Rooftop Bar", lat: -4.322, lng: 15.308, category: "Rooftop", rating: 4.3 },
  { id: 5, name: "Café de la Gare", lat: -4.340, lng: 15.334, category: "Café", rating: 4.2 },
];

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<typeof MOCK_PLACES[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMapReady, setIsMapReady] = useState(false);

  // Initialisation de la carte
  useEffect(() => {
    if (!mapRef.current || map) return;

    const mapInstance = L.map(mapRef.current, {
      center: [-4.33, 15.32],
      zoom: 13,
      zoomControl: true,
    });

    // Tuiles OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapInstance);

    // Ajouter les marqueurs
    MOCK_PLACES.forEach((place) => {
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
        setSelectedPlace(place);
      });
    });

    setMap(mapInstance);
    setIsMapReady(true);

    return () => {
      mapInstance.remove();
    };
  }, []);

  // Zoom sur un lieu sélectionné
  useEffect(() => {
    if (map && selectedPlace) {
      map.setView([selectedPlace.lat, selectedPlace.lng], 16, {
        animate: true,
        duration: 1,
      });
    }
  }, [map, selectedPlace]);

  // Filtrer les lieux
  const filteredPlaces = MOCK_PLACES.filter((place) =>
    place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    place.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold">Carte interactive</h1>
          <p className="text-primary-50 mt-1">
            Explorez les lieux autour de Kinshasa
          </p>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container mx-auto px-4 py-4">
        <div className="relative">
          {/* Barre de recherche */}
          <div className="absolute top-4 left-4 z-20 w-full max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher un lieu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-200 shadow-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Carte */}
          <div
            ref={mapRef}
            className="w-full h-[600px] rounded-2xl overflow-hidden shadow-lg border border-gray-200"
          />

          {/* Légende */}
          <div className="absolute bottom-4 left-4 z-20 bg-white rounded-xl shadow-lg p-3 border border-gray-100">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-600">Restaurant</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-gray-600">Bar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Lounge</span>
              </div>
            </div>
          </div>

          {/* Contrôles */}
          <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
            <button
              onClick={() => map?.setView([-4.33, 15.32], 13)}
              className="bg-white rounded-lg shadow-lg p-2 hover:bg-gray-50 transition-colors"
            >
              <Layers className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => map?.zoomIn()}
              className="bg-white rounded-lg shadow-lg p-2 hover:bg-gray-50 transition-colors"
            >
              <Maximize2 className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Liste des lieux (mobile) */}
        <div className="mt-4 overflow-x-auto pb-2 flex gap-3 md:hidden">
          {filteredPlaces.map((place) => (
            <button
              key={place.id}
              onClick={() => setSelectedPlace(place)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                selectedPlace?.id === place.id
                  ? "bg-primary-500 text-white"
                  : "bg-white text-gray-700 border border-gray-200"
              }`}
            >
              {place.name}
            </button>
          ))}
        </div>

        {/* Infos du lieu sélectionné */}
        <AnimatePresence>
          {selectedPlace && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-4 bg-white rounded-xl shadow-lg p-4 border border-gray-100"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedPlace.name}</h3>
                  <p className="text-sm text-gray-500">{selectedPlace.category}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{selectedPlace.rating}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/places/${selectedPlace.id}`}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-colors"
                  >
                    Voir détails
                  </Link>
                  <button
                    onClick={() => setSelectedPlace(null)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
