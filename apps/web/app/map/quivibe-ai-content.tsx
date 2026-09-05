"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, CalendarCheck2, Loader2, MapPin, Sparkles, Star } from "lucide-react";
import type { QuivibeRecommendation } from "@/features/ai/types";
import { contextSchema, type SearchContext } from "@/features/ai/conversation";
import { bookingHref } from "@/features/ai/booking";

const prompts = ["Un dîner romantique", "Un bar animé avec des amis", "Un bon restaurant à petit budget", "Où bruncher ce week-end ?", "Une sortie avec billard", "Un endroit avec piscine"];
type ChatMessage = { role: "user" | "assistant"; content: string };

export function QuivibeAiContent() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", content: "Salut, je suis Quivibe AI. Quelle sortie te ferait plaisir ?" }]);
  const [recommendations, setRecommendations] = useState<QuivibeRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<SearchContext>(() => contextSchema.parse({}));
  const [position, setPosition] = useState<{ latitude: number; longitude: number }>();
  const [locationError, setLocationError] = useState("");
  const inFlight = useRef(false);
  const conversation = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversation.current) conversation.current.scrollTop = conversation.current.scrollHeight;
  }, [messages, loading]);

  function locate() {
    if (!navigator.geolocation) { setLocationError("La géolocalisation n’est pas disponible. Indique ton quartier dans la conversation."); return; }
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setPosition({ latitude: coords.latitude, longitude: coords.longitude });
      setLocationError("");
      setQuery("Trouve-moi un endroit près de moi");
    }, () => setLocationError("Localisation indisponible. Tu peux indiquer ton quartier."), { timeout: 10000 });
  }

  async function ask(value = query) {
    const prompt = value.trim();
    if (prompt.length < 2 || prompt.length > 500 || inFlight.current) return;
    inFlight.current = true;
    setQuery("");
    const nextHistory = [...messages, { role: "user" as const, content: prompt }];
    setMessages(nextHistory);
    setLoading(true);
    try {
      const response = await fetch("/api/quivibe-ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: prompt, history: messages.slice(-12), context, previousIds: recommendations.map((p) => p.id), position }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMessages((current) => [...current, { role: "assistant", content: data.message }]);
      setContext(contextSchema.parse(data.context));
      if (data.recommendations !== null) setRecommendations(data.recommendations);
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", content: error instanceof Error ? error.message : "La connexion a été interrompue. Tu peux réessayer." }]);
      setQuery(prompt);
    } finally {
      inFlight.current = false;
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
                <input aria-label="Ton message à Quivibe AI" maxLength={500} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex. un endroit calme pour dîner à Gombe" className="min-w-0 flex-1 rounded-2xl bg-transparent px-5 py-4 text-base font-semibold text-gray-950 outline-none placeholder:text-gray-400" />
                <button type="submit" disabled={loading || query.trim().length < 2} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-6 py-4 font-extrabold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />} Trouver ma vibe
                </button>
              </div>
            </form>
            <div className="mt-5 flex flex-wrap gap-2">{prompts.map((prompt) => <button key={prompt} type="button" disabled={loading} onClick={() => void ask(prompt)} className="rounded-full border border-white/20 px-4 py-2 text-sm font-bold text-white transition hover:bg-white hover:text-gray-950">{prompt}</button>)}</div>
            <button type="button" onClick={locate} disabled={loading} className="mt-4 rounded-full border border-white/20 px-4 py-2 text-sm font-bold">{position ? "Position partagée" : "Près de moi"}</button>
            {locationError && <p role="status" className="mt-2 text-sm">{locationError}</p>}
          </div>
        </div>
      </section>
      <section className="container py-10 sm:py-14">
        <div className="max-w-3xl rounded-3xl border border-gray-200 bg-white p-5 shadow-soft sm:p-6">
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-primary-700">Conversation avec Quivibe AI</p>
          <div ref={conversation} role="log" aria-live="polite" aria-busy={loading} className="mt-5 max-h-[60vh] space-y-4 overflow-y-auto">
            {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`whitespace-pre-wrap max-w-2xl rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "ml-auto bg-gray-950 text-white" : "bg-primary-50 text-gray-800"}`}>{message.content}</div>)}
            {loading && <div className="flex w-fit items-center gap-2 rounded-2xl bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-800"><Loader2 className="h-4 w-4 animate-spin" /> Quivibe AI réfléchit…</div>}
          </div>
        </div>
        <div className="mt-10 max-w-3xl"><p className="text-sm font-extrabold uppercase tracking-[0.16em] text-primary-700">Votre sélection</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-950">Des adresses à explorer</h2></div>
        {recommendations.length === 0 ? <div className="mt-8 rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">Les adresses proposées apparaîtront ici au fil de notre conversation.</div> : (
          <div className="mt-8 grid gap-5 lg:grid-cols-3">{recommendations.map((place) => (
            <article key={place.id} className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-medium">
              <div className="relative h-48 bg-primary-50">{place.image ? <Image src={place.image} alt={place.imageAlt} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" /> : <div className="flex h-full items-center justify-center"><Sparkles className="h-10 w-10 text-primary-600" /></div>}</div>
              <div className="p-6"><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary-700">{place.category}{place.partialMatch ? " · À confirmer" : ""}</p><h3 className="mt-2 text-xl font-extrabold text-gray-950">{place.name}</h3><p className="mt-2 flex items-center gap-2 text-sm font-semibold text-gray-600"><MapPin className="h-4 w-4 text-primary-600" />{place.neighborhood} · {"$".repeat(place.priceRange)}</p>{place.rating && <p className="mt-2 flex items-center gap-1 text-sm font-extrabold text-gray-800"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{place.rating.toFixed(1)}</p>}{place.availableSlot && <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1.5 text-sm font-extrabold text-primary-800"><CalendarCheck2 className="h-4 w-4" />Disponible à {place.availableSlot}</p>}<p className="mt-4 text-sm leading-6 text-gray-600">{place.reason}</p><Link href={`/places/${place.slug}?qv_source=AI`} className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-primary-700 hover:text-primary-900">Voir l’adresse <ArrowUpRight className="h-4 w-4" /></Link>{place.reservationsEnabled && <Link href={bookingHref(place.slug, context)} className="ml-4 mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-primary-700"><CalendarCheck2 className="h-4 w-4" />Réserver</Link>}</div>
            </article>
          ))}</div>
        )}
      </section>
    </main>
  );
}
