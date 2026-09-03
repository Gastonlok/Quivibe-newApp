"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle2, KeyRound, Loader2, Mail, Save, Upload, UserRound } from "lucide-react";

type Profile = {
  name: string;
  email: string;
  image: string | null;
  role: string;
};

export function ProfileForm({ user }: { user: Profile }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: user.name, email: user.email, image: user.image ?? "" });
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const initials = form.name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();

      if (!response.ok) {
        setStatus({ type: "error", message: payload.error ?? "Impossible d'enregistrer les modifications." });
        return;
      }

      setForm(payload.user);
      setStatus({ type: "success", message: "Votre profil a ete mis a jour." });
      router.refresh();
    } catch {
      setStatus({ type: "error", message: "Une erreur reseau est survenue. Reessayez." });
    } finally {
      setSaving(false);
    }
  }

  async function uploadAvatar(file: File) {
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setStatus({ type: "error", message: "Choisissez une image de moins de 5 Mo." });
      return;
    }
    setUploading(true);
    setStatus(null);
    try {
      const signatureResponse = await fetch("/api/uploads/avatar", { method: "POST" });
      const signature = await signatureResponse.json();
      if (!signatureResponse.ok) throw new Error(signature.error);

      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("api_key", signature.apiKey);
      uploadData.append("timestamp", String(signature.timestamp));
      uploadData.append("folder", signature.folder);
      uploadData.append("signature", signature.signature);
      const response = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, { method: "POST", body: uploadData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "Echec de l'envoi de l'image.");
      setForm({ ...form, image: result.secure_url });
      setStatus({ type: "success", message: "Photo envoyee. Enregistrez votre profil pour la conserver." });
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Echec de l'envoi de l'image." });
    } finally {
      setUploading(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const response = await fetch("/api/profile/password", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(passwords) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setPasswords({ currentPassword: "", newPassword: "" });
      setStatus({ type: "success", message: payload.message });
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Impossible de modifier le mot de passe." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-15rem)] bg-gray-50 px-4 py-10 sm:px-6">
      <section className="mx-auto max-w-2xl rounded-3xl border border-gray-200 bg-white p-6 shadow-soft sm:p-10">
        <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-primary-700">Mon compte</p>
        <h1 className="mt-2 text-3xl font-extrabold text-gray-950 sm:text-4xl">Mon profil</h1>
        <p className="mt-3 text-gray-600">Mettez a jour les informations visibles sur votre compte Quivibe.</p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="flex items-center gap-4 rounded-2xl bg-primary-50 p-4">
            {form.image ? (
              <img src={form.image} alt="Photo de profil" className="h-16 w-16 rounded-full border-2 border-white object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-600 text-lg font-extrabold text-white">
                {initials || <UserRound className="h-7 w-7" />}
              </div>
            )}
            <div>
              <p className="font-extrabold text-gray-950">{form.name || "Votre profil"}</p>
              <p className="text-sm text-gray-600">{user.role === "OWNER" ? "Compte professionnel" : user.role === "ADMIN" ? "Administrateur" : "Membre Quivibe"}</p>
            </div>
          </div>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-extrabold text-gray-800"><UserRound className="h-4 w-4 text-primary-700" /> Nom</span>
            <input required minLength={2} maxLength={80} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100" />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-extrabold text-gray-800"><Mail className="h-4 w-4 text-primary-700" /> Adresse email</span>
            <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100" />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-extrabold text-gray-800"><Camera className="h-4 w-4 text-primary-700" /> URL de la photo <span className="font-medium text-gray-500">(facultatif)</span></span>
            <input type="url" placeholder="https://..." value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100" />
          </label>

          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary-300 px-4 py-3 text-sm font-extrabold text-primary-800 transition hover:bg-primary-50">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            {uploading ? "Envoi de la photo..." : "Importer une photo"}
            <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadAvatar(file); }} />
          </label>

          {status && (
            <p className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold ${status.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>
              {status.type === "success" && <CheckCircle2 className="h-5 w-5" />}
              {status.message}
            </p>
          )}

          <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 font-extrabold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </form>

        <form className="mt-10 border-t border-gray-200 pt-8" onSubmit={changePassword}>
          <h2 className="flex items-center gap-2 text-xl font-extrabold text-gray-950"><KeyRound className="h-5 w-5 text-primary-700" /> Securite</h2>
          <p className="mt-2 text-sm text-gray-600">Choisissez un nouveau mot de passe d'au moins 8 caracteres.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <input required type="password" placeholder="Mot de passe actuel" value={passwords.currentPassword} onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })} className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-primary-500" />
            <input required minLength={8} type="password" placeholder="Nouveau mot de passe" value={passwords.newPassword} onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })} className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-primary-500" />
          </div>
          <button type="submit" disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-primary-300 px-4 py-3 text-sm font-extrabold text-primary-800 hover:bg-primary-50 disabled:opacity-60"><KeyRound className="h-4 w-4" /> Modifier le mot de passe</button>
        </form>
      </section>
    </main>
  );
}
