"use client";

import { useState, useTransition } from "react";
import { CalendarPlus, Loader2, MessageSquare } from "lucide-react";
import { createOwnerEventAction, deleteOwnerEventAction, saveOwnerReviewResponseAction } from "../actions";

type Review = { id: string; comment: string; rating: number; author: { name: string }; response: { body: string } | null };
type Event = { id: string; title: string; startDate: Date };

export function OwnerEngagementPanel({ placeId, reviews, events }: { placeId: string; reviews: Review[]; events: Event[] }) {
  const [event, setEvent] = useState({ title: "", description: "", startDate: "", endDate: "" });
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function createEvent() {
    startTransition(async () => {
      const result = await createOwnerEventAction({ placeId, ...event });
      setMessage(result.success ? "Evenement publie." : result.error);
      if (result.success) setEvent({ title: "", description: "", startDate: "", endDate: "" });
    });
  }

  function respond(reviewId: string) {
    startTransition(async () => {
      const result = await saveOwnerReviewResponseAction(reviewId, responses[reviewId] || "");
      setMessage(result.success ? "Reponse enregistree." : result.error);
    });
  }

  function removeEvent(eventId: string) {
    startTransition(async () => {
      const result = await deleteOwnerEventAction(eventId);
      setMessage(result.success ? "Evenement retire." : result.error);
    });
  }

  return <div className="grid gap-6 xl:grid-cols-2">
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
      <div className="flex items-center gap-3"><CalendarPlus className="h-5 w-5 text-primary-600" /><div><h2 className="font-extrabold text-gray-950">Nouvel evenement</h2><p className="text-sm text-gray-600">Il sera visible sur votre fiche et dans la page evenements.</p></div></div>
      <div className="mt-5 space-y-3"><input value={event.title} onChange={(e) => setEvent({ ...event, title: e.target.value })} placeholder="Titre" className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" /><textarea value={event.description} onChange={(e) => setEvent({ ...event, description: e.target.value })} placeholder="Description" rows={3} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" /><input value={event.startDate} onChange={(e) => setEvent({ ...event, startDate: e.target.value })} type="datetime-local" className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" /><input value={event.endDate} onChange={(e) => setEvent({ ...event, endDate: e.target.value })} type="datetime-local" className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" /></div>
      <button type="button" onClick={createEvent} disabled={isPending} className="mt-4 rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{isPending ? "Publication..." : "Publier l'evenement"}</button>
      <div className="mt-5 space-y-2">{events.length === 0 ? <p className="text-sm text-gray-500">Aucun evenement a venir.</p> : events.map((event) => <div key={event.id} className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-3"><span className="text-sm font-bold text-gray-800">{event.title} · {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(event.startDate)}</span><button type="button" onClick={() => removeEvent(event.id)} disabled={isPending} className="text-sm font-bold text-red-700 disabled:opacity-50">Retirer</button></div>)}</div>
    </section>
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft"><div className="flex items-center gap-3"><MessageSquare className="h-5 w-5 text-primary-600" /><div><h2 className="font-extrabold text-gray-950">Repondre aux avis</h2><p className="text-sm text-gray-600">Les reponses sont visibles publiquement.</p></div></div>
      <div className="mt-5 space-y-4">{reviews.length === 0 ? <p className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">Aucun avis a traiter.</p> : reviews.map((review) => <article key={review.id} className="rounded-2xl bg-gray-50 p-4"><p className="font-bold text-gray-900">{review.author.name} · {review.rating}/5</p><p className="mt-1 text-sm text-gray-700">{review.comment}</p><textarea value={responses[review.id] ?? review.response?.body ?? ""} onChange={(e) => setResponses({ ...responses, [review.id]: e.target.value })} rows={2} placeholder="Votre reponse" className="mt-3 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm" /><button type="button" onClick={() => respond(review.id)} disabled={isPending} className="mt-2 text-sm font-bold text-primary-700 disabled:opacity-50">{isPending ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "Enregistrer la reponse"}</button></article>)}</div>
    </section>
    {message && <p className="xl:col-span-2 text-sm font-semibold text-gray-600">{message}</p>}
  </div>;
}
