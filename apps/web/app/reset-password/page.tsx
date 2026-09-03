"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== confirmation) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Impossible de mettre a jour le mot de passe.");
      setCompleted(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) return <InvalidResetLink />;

  return (
    <main className="min-h-[calc(100vh-200px)] bg-[radial-gradient(circle_at_top,_#e8f7ef,_#f9fafb_45%)] px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-md">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-extrabold text-gray-600 transition hover:text-primary-700"><ArrowLeft className="h-4 w-4" /> Retour a la connexion</Link>
        <section className="mt-5 rounded-3xl border border-gray-200 bg-white p-7 shadow-medium sm:p-9">
          {completed ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-50"><CheckCircle2 className="h-7 w-7 text-primary-600" /></div>
              <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-gray-950">Mot de passe mis a jour</h1>
              <p className="mt-3 text-sm leading-6 text-gray-600">Votre nouveau mot de passe est actif. Vous pouvez maintenant vous connecter a votre compte.</p>
              <Link href="/login" className="mt-6 inline-flex rounded-full bg-primary-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-primary-700">Se connecter</Link>
            </div>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50"><KeyRound className="h-6 w-6 text-primary-700" /></div>
              <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">Nouveau mot de passe</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-950">Securisez votre compte</h1>
              <p className="mt-3 text-sm leading-6 text-gray-600">Choisissez un mot de passe d'au moins 8 caracteres. Ce lien est utilisable une seule fois.</p>

              <form onSubmit={submit} className="mt-7 space-y-5">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-gray-800">Nouveau mot de passe</span>
                  <div className="relative">
                    <input required minLength={8} type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="8 caracteres minimum" className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 pr-12 text-sm font-semibold outline-none transition focus:border-primary-600 focus:ring-4 focus:ring-primary-100" />
                    <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-500 hover:text-primary-700" aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-gray-800">Confirmer le mot de passe</span>
                  <input required minLength={8} type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-primary-600 focus:ring-4 focus:ring-primary-100" />
                </label>
                {error && <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
                <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-soft transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} Enregistrer le mot de passe</button>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function InvalidResetLink() {
  return <main className="mx-auto flex min-h-[60vh] max-w-md items-center px-4"><section className="w-full rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-soft"><KeyRound className="mx-auto h-10 w-10 text-primary-700" /><h1 className="mt-4 text-2xl font-extrabold text-gray-950">Lien incomplet</h1><p className="mt-2 text-sm leading-6 text-gray-600">Ce lien de reinitialisation est invalide ou incomplet. Demandez-en un nouveau pour continuer.</p><Link href="/forgot-password" className="mt-6 inline-flex rounded-full bg-primary-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-primary-700">Demander un nouveau lien</Link></section></main>;
}

function ResetPasswordFallback() {
  return <main className="mx-auto flex min-h-[60vh] max-w-md items-center px-4"><div className="h-80 w-full animate-pulse rounded-3xl bg-gray-100" /></main>;
}
