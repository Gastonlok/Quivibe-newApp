"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

export function NewsletterSubscribeForm() {
  const id = useId(),
    busy = useRef(false);
  const [pending, setPending] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          consent: form.get("consent") === "on",
          website: form.get("website") || "",
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Impossible de vous inscrire. Réessayez.");
        return;
      }
      setMessage(result.message);
    } catch {
      setError("Connexion interrompue. Réessayez dans un instant.");
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return message ? (
    <div
      role="status"
      className="flex items-start gap-3 rounded-2xl border border-primary-700 bg-gray-800 p-5 text-sm leading-6 text-white"
    >
      <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary-400" />
      {message}
    </div>
  ) : (
    <form
      onSubmit={submit}
      aria-label="Inscription à la newsletter"
      className="space-y-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor={id} className="sr-only">
          Votre adresse e-mail
        </label>
        <input
          id={id}
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
          placeholder="Votre email"
          aria-describedby={error ? `${id}-error` : undefined}
          className="min-w-0 flex-1 rounded-full border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none placeholder:text-gray-400 focus:border-primary-500"
        />
        <button
          disabled={pending}
          className="flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary-500 px-6 py-3 font-semibold text-white transition hover:bg-primary-600 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {pending ? "Inscription…" : "S’abonner"}
          {!pending && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
      <div className="hidden" aria-hidden="true">
        <label>
          Votre site web
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="flex items-start gap-3 text-xs leading-5 text-gray-400">
        <input
          name="consent"
          type="checkbox"
          required
          className="mt-0.5 h-4 w-4 shrink-0 accent-primary-500"
        />
        <span>
          J’accepte de recevoir la newsletter Quivibe par e-mail. Désinscription
          à tout moment.{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-2 hover:text-white"
          >
            Confidentialité
          </Link>
        </span>
      </label>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
    </form>
  );
}
