"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, Loader2, Mail, Plus, Save, Send } from "lucide-react";

type Campaign = {
  id: string;
  revision: number;
  subject: string;
  body: string;
  status: string;
  createdAt: string;
};
type Data = {
  subscribers: {
    id: string;
    email: string;
    status: string;
    requestedAt: string;
    confirmedAt: string | null;
  }[];
  total: number;
  page: number;
  counts: { status: string; _count: number }[];
  campaigns: Campaign[];
  deliveries: { campaignId: string; status: string; _count: number }[];
  emailConfigured: boolean;
};
const blank = (): Campaign => ({
  id: crypto.randomUUID(),
  revision: 0,
  subject: "",
  body: "",
  status: "DRAFT",
  createdAt: "",
});
const labels: Record<string, string> = {
  ACTIVE: "Confirmé",
  PENDING: "En attente",
  UNSUBSCRIBED: "Désinscrit",
  SENT: "Accepté par le service d’e-mail",
  FAILED: "Échec",
  SKIPPED: "Ignoré",
  SENDING: "En cours",
};
export default function NewsletterPage() {
  const [data, setData] = useState<Data | null>(null),
    [draft, setDraft] = useState<Campaign | null>(null);
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [query, setQuery] = useState("");
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [pending, setPending] = useState(false),
    [preview, setPreview] = useState(false),
    [processing, setProcessing] = useState(false);
  const busy = useRef(false);
  const [deliveryPass, setDeliveryPass] = useState(0);
  const load = useCallback(async () => {
    const response = await fetch(
      `/api/admin/newsletter?page=${page}&search=${encodeURIComponent(query)}`,
    );
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Chargement impossible.");
    setData(result);
  }, [page, query]);
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);
  useEffect(() => {
    setDraft(blank());
  }, []);
  useEffect(() => {
    if (!processing) return;
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/admin/newsletter/deliver", {
          method: "POST",
        });
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.error || "Traitement interrompu.");
        if (active) {
          await load();
          if (result.ready > 0 && !result.unavailable)
            setDeliveryPass((p) => p + 1);
          else setProcessing(false);
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : "Traitement interrompu.");
          setProcessing(false);
        }
      }
    }, 1200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [processing, load, deliveryPass]);
  const activeCount =
    data?.counts.find((c) => c.status === "ACTIVE")?._count || 0;
  const saved = data?.campaigns.find((c) => c.id === draft?.id);
  const dirty =
    !saved || saved.subject !== draft?.subject || saved.body !== draft?.body;
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy.current || !draft) return;
    busy.current = true;
    setPending(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: draft.id,
          revision: draft.revision,
          subject: draft.subject,
          body: draft.body,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setDraft(result);
      await load();
      setNotice(
        "Brouillon enregistré. Vérifiez l’aperçu avant de lancer l’envoi.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  async function send() {
    if (busy.current || !draft) return;
    busy.current = true;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/newsletter", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: draft.id, revision: draft.revision }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setDraft(result);
      setPreview(false);
      await load();
      setNotice("Campagne lancée. Les envois sont suivis ci-dessous.");
      setProcessing(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Envoi impossible.");
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  const button =
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold disabled:opacity-50";
  return (
    <main className="mx-auto max-w-6xl space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary-700">
            Communication
          </p>
          <h1 className="mt-2 text-3xl font-extrabold">Newsletter</h1>
          <p className="mt-2 text-sm text-gray-600">
            Les bonnes adresses de Quivibe, pour les personnes qui ont confirmé
            leur inscription.
          </p>
        </div>
        <Mail className="h-9 w-9 text-primary-600" />
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-xl bg-green-50 p-4 text-green-800">
          {notice}
        </p>
      )}
      {data && !data.emailConfigured && (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          L’envoi d’e-mails n’est pas configuré. Renseignez RESEND_API_KEY et
          l’expéditeur RESEND_FROM_EMAIL sur le serveur. Les demandes restent en
          attente et seuls les abonnés confirmés peuvent recevoir une campagne.
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {["ACTIVE", "PENDING", "UNSUBSCRIBED"].map((status) => (
          <div
            key={status}
            className="rounded-2xl border border-gray-100 bg-white p-5"
          >
            <p className="text-sm text-gray-500">
              {status === "ACTIVE"
                ? "Abonnés confirmés"
                : status === "PENDING"
                  ? "Confirmations attendues"
                  : "Désinscriptions"}
            </p>
            <p className="mt-2 text-3xl font-extrabold">
              {data?.counts.find((c) => c.status === status)?._count || 0}
            </p>
          </div>
        ))}
      </div>
      <section className="rounded-3xl border border-gray-100 bg-white p-5 sm:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold">Préparer une newsletter</h2>
          <button
            className={`${button} border border-gray-200`}
            disabled={pending}
            onClick={() => {
              setDraft(blank());
              setPreview(false);
              setNotice("");
            }}
          >
            <Plus className="h-4 w-4" />
            Nouveau brouillon
          </button>
        </div>
        {draft && (
          <form onSubmit={save} className="space-y-5">
            <label className="block text-sm font-bold">
              Sujet
              <input
                required
                minLength={2}
                maxLength={160}
                disabled={draft.status !== "DRAFT" || pending}
                value={draft.subject}
                onChange={(e) => {
                  setDraft({ ...draft, subject: e.target.value });
                  setPreview(false);
                }}
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 font-normal"
              />
            </label>
            <label className="block text-sm font-bold">
              Contenu
              <textarea
                required
                minLength={10}
                maxLength={10000}
                rows={8}
                disabled={draft.status !== "DRAFT" || pending}
                value={draft.body}
                onChange={(e) => {
                  setDraft({ ...draft, body: e.target.value });
                  setPreview(false);
                }}
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 font-normal"
              />
            </label>
            <p className="text-xs text-gray-500">
              Un lien de désinscription est ajouté automatiquement à chaque
              e-mail. Chaque abonné reçoit un message individuel.
            </p>
            {draft.status === "DRAFT" && (
              <div className="flex flex-wrap gap-3">
                <button
                  disabled={pending || !dirty}
                  className={`${button} bg-gray-950 text-white`}
                >
                  {pending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Enregistrer le brouillon
                </button>
                <button
                  type="button"
                  disabled={pending || dirty}
                  onClick={() => setPreview((v) => !v)}
                  className={`${button} border border-primary-200 text-primary-800`}
                >
                  <Eye className="h-4 w-4" />
                  Aperçu avant envoi
                </button>
              </div>
            )}
          </form>
        )}
        {preview && draft && (
          <div className="mt-6 rounded-2xl border border-primary-200 bg-primary-50 p-5">
            <p className="text-xs font-bold uppercase text-primary-700">
              Aperçu · {activeCount} abonné{activeCount > 1 ? "s" : ""} confirmé
              {activeCount > 1 ? "s" : ""}
            </p>
            <h3 className="mt-4 break-words text-xl font-extrabold">
              {draft.subject}
            </h3>
            <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7">
              {draft.body}
            </p>
            <p className="mt-6 border-t border-primary-200 pt-4 text-xs text-gray-600">
              Vous recevez cet e-mail suite à votre inscription à la newsletter
              Quivibe. Se désinscrire.
            </p>
            <button
              disabled={
                pending || dirty || !activeCount || !data?.emailConfigured
              }
              onClick={send}
              className={`${button} mt-5 bg-primary-600 text-white`}
            >
              <Send className="h-4 w-4" />
              Confirmer l’envoi aux abonnés
            </button>
          </div>
        )}
      </section>
      <section className="rounded-3xl border border-gray-100 bg-white p-5 sm:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold">Campagnes et suivi</h2>
          <button
            className={`${button} border border-gray-200`}
            disabled={processing || !data?.emailConfigured}
            onClick={() => setProcessing(true)}
          >
            {processing && <Loader2 className="h-4 w-4 animate-spin" />}
            {processing ? "Envois en cours…" : "Poursuivre les envois"}
          </button>
        </div>
        <p className="mb-5 text-xs text-gray-500">
          Les totaux indiquent les e-mails acceptés par le service d’envoi, pas
          leur ouverture. Les échecs peuvent être retentés après cinq minutes,
          dans la limite de trois tentatives.
        </p>
        <div className="space-y-3">
          {data?.campaigns.map((c) => (
            <article
              key={c.id}
              className="rounded-xl border border-gray-100 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="break-words font-bold">{c.subject}</h3>
                <button
                  onClick={() => {
                    setDraft(c);
                    setPreview(false);
                  }}
                  className="text-sm font-bold text-primary-700"
                >
                  {c.status === "DRAFT"
                    ? "Ouvrir le brouillon"
                    : "Voir le contenu"}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                <span>
                  {c.status === "DRAFT" ? "Brouillon" : "Campagne lancée"}
                </span>
                {data.deliveries
                  .filter((d) => d.campaignId === c.id)
                  .map((d) => (
                    <span key={d.status}>
                      {labels[d.status] || d.status} : {d._count}
                    </span>
                  ))}
              </div>
            </article>
          ))}
          {!data?.campaigns.length && (
            <p className="text-sm text-gray-500">Aucune newsletter préparée.</p>
          )}
        </div>
      </section>
      <section className="rounded-3xl border border-gray-100 bg-white p-5 sm:p-7">
        <h2 className="text-xl font-extrabold">Abonnés</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setQuery(search);
          }}
          className="my-5 flex flex-wrap gap-3"
        >
          <input
            aria-label="Rechercher un abonné"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une adresse e-mail"
            className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm"
          />
          <button className={`${button} border border-gray-200`}>
            Rechercher
          </button>
        </form>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-3">Adresse e-mail</th>
                <th className="p-3">Statut</th>
                <th className="p-3">Inscription</th>
              </tr>
            </thead>
            <tbody>
              {data?.subscribers.map((s) => (
                <tr key={s.id} className="border-b border-gray-100">
                  <td className="p-3">{s.email}</td>
                  <td className="whitespace-nowrap p-3">{labels[s.status]}</td>
                  <td className="whitespace-nowrap p-3">
                    {new Date(s.requestedAt).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!data?.subscribers.length && (
          <p className="mt-4 text-sm text-gray-500">Aucun abonné trouvé.</p>
        )}
        <div className="mt-5 flex items-center justify-between text-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="font-bold disabled:opacity-40"
          >
            Précédent
          </button>
          <span>
            {page} / {Math.max(1, Math.ceil((data?.total || 0) / 50))}
          </span>
          <button
            disabled={page * 50 >= (data?.total || 0)}
            onClick={() => setPage((p) => p + 1)}
            className="font-bold disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      </section>
    </main>
  );
}
