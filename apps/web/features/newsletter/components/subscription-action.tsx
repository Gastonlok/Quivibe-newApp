"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { CheckCircle2, Mail } from "lucide-react";

export function SubscriptionAction({
  token,
  mode,
}: {
  token: string;
  mode: "confirm" | "unsubscribe";
}) {
  const [done, setDone] = useState(false),
    [pending, setPending] = useState(false),
    [error, setError] = useState("");
  const busy = useRef(false),
    confirming = mode === "confirm";
  async function submit() {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/newsletter/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) {
        const result = await response.json();
        setError(result.error || "La demande n’a pas abouti.");
        return;
      }
      setDone(true);
    } catch {
      setError("Connexion interrompue. Réessayez.");
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return (
    <main className="container py-16">
      <section className="mx-auto max-w-lg rounded-3xl border border-gray-100 bg-white p-7 text-center shadow-soft">
        {done ? (
          <CheckCircle2 className="mx-auto mb-5 h-10 w-10 text-green-600" />
        ) : (
          <Mail className="mx-auto mb-5 h-10 w-10 text-primary-600" />
        )}
        <h1 className="text-2xl font-extrabold">
          {done
            ? confirming
              ? "Bienvenue dans la newsletter Quivibe !"
              : "Vous êtes désinscrit"
            : confirming
              ? "Confirmez votre inscription"
              : "Vous souhaitez vous désinscrire ?"}
        </h1>
        <p className="mt-4 text-sm leading-6 text-gray-600">
          {done
            ? confirming
              ? "Vous recevrez nos prochaines sélections d’adresses et d’événements à Kinshasa."
              : "Vous ne recevrez plus nos prochaines newsletters. Vos réservations et votre compte restent accessibles."
            : confirming
              ? "Un dernier clic pour recevoir nos recommandations par e-mail."
              : "Confirmez pour ne plus recevoir la newsletter Quivibe."}
        </p>
        {error && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {error}
          </p>
        )}
        {!done && (
          <button
            onClick={submit}
            disabled={pending || !token}
            className="mt-6 rounded-full bg-primary-600 px-6 py-3 font-bold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {pending
              ? "Traitement…"
              : confirming
                ? "Confirmer mon inscription"
                : "Me désinscrire"}
          </button>
        )}
        {!token && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            Le lien est incomplet.
          </p>
        )}
        <Link
          href="/"
          className="mt-6 block text-sm font-bold text-primary-700"
        >
          Retour à Quivibe
        </Link>
      </section>
    </main>
  );
}
