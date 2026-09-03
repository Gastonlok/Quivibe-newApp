"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, Mail, ShieldCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Impossible d'envoyer le lien pour le moment.");
      setSent(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-200px)] bg-[radial-gradient(circle_at_top,_#e8f7ef,_#f9fafb_45%)] px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-md">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-extrabold text-gray-600 transition hover:text-primary-700">
          <ArrowLeft className="h-4 w-4" /> Retour a la connexion
        </Link>

        <section className="mt-5 rounded-3xl border border-gray-200 bg-white p-7 shadow-medium sm:p-9">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-50">
                <CheckCircle2 className="h-7 w-7 text-primary-600" />
              </div>
              <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-gray-950">Verifiez votre boite mail</h1>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                Si cette adresse correspond a un compte Quivibe, un lien de reinitialisation vient d'etre envoye. Il expire dans une heure.
              </p>
              <Link href="/login" className="mt-6 inline-flex rounded-full bg-primary-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-primary-700">
                Retour a la connexion
              </Link>
            </div>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50">
                <ShieldCheck className="h-6 w-6 text-primary-700" />
              </div>
              <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">Acces au compte</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-950">Mot de passe oublie ?</h1>
              <p className="mt-3 text-sm leading-6 text-gray-600">Indiquez votre adresse e-mail. Nous vous enverrons un lien securise pour choisir un nouveau mot de passe.</p>

              <form onSubmit={submit} className="mt-7 space-y-5">
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-2 text-sm font-bold text-gray-800"><Mail className="h-4 w-4 text-primary-600" /> Adresse e-mail</span>
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="grace.mbala@exemple.cd"
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-primary-600 focus:ring-4 focus:ring-primary-100"
                  />
                </label>

                {error && <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

                <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-soft transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Envoyer le lien securise
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
