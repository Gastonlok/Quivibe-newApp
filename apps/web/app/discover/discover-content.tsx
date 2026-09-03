"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, MapPin } from "lucide-react";
import { PlaceCard } from "@/features/places/components/place-card";
import { listPlacesAction, type PlaceWithFavorites } from "@/features/places/actions";
import { slugify } from "@/utils/slugify";

export default function DiscoverContent() {
  const searchParams = useSearchParams();
  const [places, setPlaces] = useState<PlaceWithFavorites[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [reservationsOnly, setReservationsOnly] = useState(false);
  const [eventsOnly, setEventsOnly] = useState(false);
  const [position, setPosition] = useState<GeolocationCoordinates | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const result = await listPlacesAction({ search: searchParams.get("search") || undefined, neighborhood: searchParams.get("neighborhood") || undefined, priceRange: budget || undefined, page: "1", category: category || undefined, reservationsOnly: reservationsOnly ? "true" : undefined, eventsOnly: eventsOnly ? "true" : undefined });
      if (result.success && result.data) { setPlaces(result.data.places); setTotal(result.data.total); }
      setLoading(false);
    }
    void load();
  }, [searchParams, category, budget, reservationsOnly, eventsOnly]);

  const sorted = position ? [...places].sort((a, b) => distance(position, a.latitude, a.longitude) - distance(position, b.latitude, b.longitude)) : places;
  const neighborhoods = useMemo(() => [...new Set(places.map((place) => place.neighborhood))].sort((a, b) => a.localeCompare(b, "fr")), [places]);

  function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("search") || "");
    const params = new URLSearchParams(searchParams);
    value ? params.set("search", value) : params.delete("search");
    window.history.pushState(null, "", `?${params.toString()}`);
  }

  return <main className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10">
    <div><p className="text-sm font-extrabold uppercase tracking-[0.18em] text-primary-700">Explorer Kinshasa</p><h1 className="mt-2 text-3xl font-extrabold text-gray-950">Ou sort-on ce soir ?</h1><p className="mt-1 text-sm text-gray-600">{total} établissement{total > 1 ? "s" : ""} à découvrir</p>{neighborhoods.length > 0 && <nav aria-label="Explorer par quartier" className="mt-4 flex flex-wrap gap-2">{neighborhoods.map((neighborhood) => <Link key={neighborhood} href={`/restaurants/${slugify(neighborhood)}`} className="rounded-full bg-primary-50 px-3 py-1.5 text-sm font-bold text-primary-800 hover:bg-primary-100">À {neighborhood}</Link>)}</nav>}</div>
    <form onSubmit={search} className="flex gap-2"><input name="search" defaultValue={searchParams.get("search") || ""} placeholder="Lieu, cuisine ou quartier..." className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-primary-600" /><button className="rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white">Rechercher</button></form>
    <div className="flex flex-wrap gap-2">{["restaurant", "bar", "lounge", "rooftop", "cafe"].map((item) => <button key={item} type="button" onClick={() => setCategory(category === item ? "" : item)} className={`rounded-full px-4 py-2 text-sm font-bold ${category === item ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700"}`}>{item}</button>)}</div>
    <section className="flex flex-wrap gap-2 rounded-2xl border border-gray-200 bg-white p-3"><select value={budget} onChange={(event) => setBudget(event.target.value)} className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700"><option value="">Tous les budgets</option><option value="1">$ - Petit budget</option><option value="2">$$ - Modere</option><option value="3">$$$ - Premium</option><option value="4">$$$$ - Luxe</option></select><Filter active={reservationsOnly} toggle={() => setReservationsOnly(!reservationsOnly)} label="Reservation ouverte" /><Filter active={eventsOnly} toggle={() => setEventsOnly(!eventsOnly)} label="Evenements a venir" /><button type="button" onClick={() => navigator.geolocation?.getCurrentPosition((next) => setPosition(next.coords))} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${position ? "bg-primary-50 text-primary-800" : "bg-gray-100 text-gray-700"}`}><MapPin className="h-4 w-4" />Pres de moi</button></section>
    {loading ? <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div> : sorted.length === 0 ? <div className="py-12 text-center text-gray-600">Aucun établissement ne correspond à ces filtres.</div> : <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{sorted.map((place) => <PlaceCard key={place.id} place={place} />)}</div>}
  </main>;
}

function Filter({ active, label, toggle }: { active: boolean; label: string; toggle: () => void }) {
  return <button type="button" onClick={toggle} className={`rounded-xl px-3 py-2 text-sm font-bold ${active ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700"}`}>{label}</button>;
}

function distance(position: GeolocationCoordinates, latitude: number, longitude: number) {
  const radians = (value: number) => (value * Math.PI) / 180;
  const lat = radians(latitude - position.latitude);
  const lng = radians(longitude - position.longitude);
  const value = Math.sin(lat / 2) ** 2 + Math.cos(radians(position.latitude)) * Math.cos(radians(latitude)) * Math.sin(lng / 2) ** 2;
  return 12_742 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}
