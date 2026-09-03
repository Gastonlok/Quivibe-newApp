"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Loader2, MapPin, Sparkles, Star } from "lucide-react";
import type { QuivibePlace, QuivibeRecommendation } from "@/features/ai/types";
import { defaultIntroduction, recommendPlaces } from "@/features/ai/recommend";

const prompts = ["Un dîner romantique", "Un bar animé avec des amis", "Un bon restaurant à petit budget", "Où bruncher ce week-end ?"];

export function QuivibeAiContent({ places }: { places: QuivibePlace[] }) {
  const [query, setQuery] = useState("");
  const [introduction, setIntroduction] = useState("Dites-moi ce dont vous avez envie, je vous trouve la bonne sortie.");
  const [recommendations, setRecommendations] = useState<QuivibeRecommendation[]>(() => recommendPlaces("", places));
  const [loading, setLoading] = useState(false);

  async function ask(value = query) {
    const prompt = value.trim();
    if (prompt.length < 2) return;
    setQuery(prompt);
    setLoading(true);
    try {
      const response = await fetch("/api/quivibe-ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: prompt }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setIntroduction(data.introduction);
      setRecommendations(data.recommendations);
    } catch (error) {
      const fallback = recommendPlaces(prompt, places);
      setIntroduction(error instanceof Error ? `${error.message} Voici quelques idées disponibles.` : defaultIntroduction(fallback.length));
      setRecommendations(fallback);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f3ea]">
      <section className="overflow-hidden bg-gray-950 text-white">
        <div className="container relative py-14 sm:py-20">
          <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-primary-600/40 blur-3xl" />
          <div className="relative max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-extrabold text-primary-100"><Sparkles className="h-4 w-4" /> Quivibe AI</p>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl">Ce soir, on sort où ?</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-300">Décrivez votre envie. Quivibe AI sélectionne les bonnes adresses de Kinshasa selon l’ambiance, le budget et le quartier.</p>
            <form onSubmit={(event) => { event.preventDefault(); void ask(); }} className="mt-8 rounded-3xl bg-white p-2 shadow-medium">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex. un endroit calme pour dîner à Gombe" className="min-w-0 flex-1 rounded-2xl bg-transparent px-5 py-4 text-base font-semibold text-gray-950 outline-none placeholder:text-gray-400" />
                <button type="submit" disabled={loading || query.trim().length < 2} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-6 py-4 font-extrabold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />} Trouver ma vibe
                </button>
              </div>
            </form>
            <div className="mt-5 flex flex-wrap gap-2">{prompts.map((prompt) => <button key={prompt} type="button" onClick={() => void ask(prompt)} className="rounded-full border border-white/20 px-4 py-2 text-sm font-bold text-white transition hover:bg-white hover:text-gray-950">{prompt}</button>)}</div>
          </div>
        </div>
      </section>
      <section className="container py-10 sm:py-14">
        <div className="max-w-3xl"><p className="text-sm font-extrabold uppercase tracking-[0.16em] text-primary-700">Votre sélection</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-950">{introduction}</h2></div>
        {recommendations.length === 0 ? <div className="mt-8 rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">Aucune adresse ne correspond pour l’instant. Essayez une autre envie ou un autre quartier.</div> : (
          <div className="mt-8 grid gap-5 lg:grid-cols-3">{recommendations.map((place) => (
            <article key={place.id} className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-medium">
              <div className="relative h-48 bg-primary-50">{place.image ? <Image src={place.image} alt={place.imageAlt} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" /> : <div className="flex h-full items-center justify-center"><Sparkles className="h-10 w-10 text-primary-600" /></div>}</div>
              <div className="p-6"><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary-700">{place.category}</p><h3 className="mt-2 text-xl font-extrabold text-gray-950">{place.name}</h3><p className="mt-2 flex items-center gap-2 text-sm font-semibold text-gray-600"><MapPin className="h-4 w-4 text-primary-600" />{place.neighborhood} · {"$".repeat(place.priceRange)}</p>{place.rating && <p className="mt-2 flex items-center gap-1 text-sm font-extrabold text-gray-800"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{place.rating.toFixed(1)}</p>}<p className="mt-4 text-sm leading-6 text-gray-600">{place.reason}</p><Link href={`/places/${place.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-primary-700 hover:text-primary-900">Voir l’adresse <ArrowUpRight className="h-4 w-4" /></Link></div>
            </article>
          ))}</div>
        )}
      </section>
    </main>
  );
}
