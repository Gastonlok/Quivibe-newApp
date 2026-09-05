"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Crosshair, Loader2, LocateFixed } from "lucide-react";
import type L from "leaflet";
import type { PlaceCoordinates } from "../location-schema";

export function LocationPicker({
  value,
  onChange,
}: {
  value: PlaceCoordinates | null;
  onChange: (value: PlaceCoordinates) => void;
}) {
  const latitude = value?.latitude,
    longitude = value?.longitude;
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const leaflet = useRef<typeof L | null>(null);
  const latest = useRef({ value, onChange });
  latest.current = { value, onChange };
  const generation = useRef(0);
  const [locating, setLocating] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [accuracy, setAccuracy] = useState<number | null>(null);

  function select(position: PlaceCoordinates) {
    generation.current++;
    setLocating(false);
    setError("");
    setAccuracy(null);
    latest.current.onChange({
      latitude: Number(position.latitude.toFixed(6)),
      longitude: Number(position.longitude.toFixed(6)),
    });
  }
  const selectRef = useRef(select);
  selectRef.current = select;
  useEffect(() => {
    const requests = generation;
    let disposed = false;
    let resize: ResizeObserver | undefined;
    void import("leaflet")
      .then(({ default: library }) => {
        if (disposed || !container.current) return;
        leaflet.current = library;
        const initial = latest.current.value;
        const instance = library
          .map(container.current, { scrollWheelZoom: false })
          .setView(
            initial ? [initial.latitude, initial.longitude] : [-4.325, 15.322],
            initial ? 16 : 12,
          );
        map.current = instance;
        library
          .tileLayer(
            process.env.NEXT_PUBLIC_MAP_TILE_URL ||
              "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
              maxZoom: 19,
            },
          )
          .addTo(instance);
        instance.on("click", (event: L.LeafletMouseEvent) =>
          selectRef.current({
            latitude: event.latlng.lat,
            longitude: event.latlng.wrap().lng,
          }),
        );
        resize = new ResizeObserver(() =>
          instance.invalidateSize({ pan: false }),
        );
        resize.observe(container.current);
        setReady(true);
      })
      .catch(() => {
        if (!disposed)
          setError(
            "La carte n’a pas pu charger. Vous pouvez utiliser votre position.",
          );
      });
    return () => {
      disposed = true;
      requests.current++;
      resize?.disconnect();
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, []);
  useEffect(() => {
    if (!ready || !map.current || !leaflet.current) return;
    if (latitude === undefined || longitude === undefined) {
      marker.current?.remove();
      marker.current = null;
      return;
    }
    const point: L.LatLngExpression = [latitude, longitude];
    if (!marker.current) {
      marker.current = leaflet.current
        .marker(point, {
          draggable: true,
          title: "Emplacement de l’établissement",
          icon: leaflet.current.divIcon({
            className: "",
            html: '<span style="display:block;width:24px;height:24px;border:3px solid white;border-radius:50%;background:#d97706;box-shadow:0 1px 6px #0008"></span>',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          }),
        })
        .addTo(map.current);
      marker.current.on("dragend", () => {
        const point = marker.current!.getLatLng().wrap();
        selectRef.current({ latitude: point.lat, longitude: point.lng });
      });
    } else marker.current.setLatLng(point);
    map.current.setView(point, Math.max(map.current.getZoom(), 16), {
      animate: false,
    });
  }, [latitude, longitude, ready]);

  function locate() {
    if (locating) return;
    if (!navigator.geolocation) {
      setError(
        "La localisation n’est pas disponible. Choisissez l’emplacement sur la carte.",
      );
      return;
    }
    const request = ++generation.current;
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (request !== generation.current) return;
        select({ latitude: coords.latitude, longitude: coords.longitude });
        setAccuracy(Math.round(coords.accuracy));
      },
      (failure) => {
        if (request !== generation.current) return;
        setLocating(false);
        setError(
          failure.code === 1
            ? "Localisation refusée. Autorisez-la dans votre navigateur ou placez le repère sur la carte."
            : "Position indisponible. Réessayez ou choisissez l’emplacement sur la carte.",
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }
  return (
    <fieldset className="min-w-0 space-y-3" data-testid="location-picker">
      <legend className="text-sm font-bold text-gray-800">
        Localisation de l’établissement *
      </legend>
      <p className="text-sm text-gray-600">
        Utilisez votre position si vous êtes sur place. Sinon, cliquez sur la
        carte ou déplacez le repère jusqu’à l’établissement.
      </p>
      <button
        type="button"
        onClick={locate}
        disabled={locating}
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-60"
      >
        {locating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LocateFixed className="h-4 w-4" />
        )}
        {locating ? "Localisation en cours…" : "Utiliser ma position"}
      </button>
      <div className="relative isolate overflow-hidden rounded-2xl border border-gray-200">
        <div
          ref={container}
          role="region"
          aria-label="Carte de localisation de l’établissement"
          className="h-60 w-full bg-gray-100"
        />
        <Crosshair
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 z-[400] h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-gray-800"
        />
      </div>
      <button
        type="button"
        disabled={!ready}
        onClick={() => {
          const point = map.current?.getCenter().wrap();
          if (point) select({ latitude: point.lat, longitude: point.lng });
        }}
        className="text-sm font-bold text-primary-700 underline underline-offset-4 disabled:opacity-50"
      >
        Placer le repère au centre de la carte
      </button>
      <p
        role="status"
        className={`flex items-start gap-2 text-sm ${value ? "text-green-800" : "text-gray-600"}`}
      >
        {value && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
        {value
          ? `Emplacement sélectionné.${accuracy !== null ? ` Précision estimée : ${accuracy} m. Ajustez le repère si nécessaire.` : " Vous pouvez encore déplacer le repère."}`
          : "Sélectionnez l’emplacement avant d’enregistrer."}
      </p>
      {error && (
        <p role="alert" className="text-sm text-amber-800">
          {error}
        </p>
      )}
    </fieldset>
  );
}
