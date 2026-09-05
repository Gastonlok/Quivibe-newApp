"use client";
import { useEffect, useState } from "react";
import { adminRequest } from "@/features/admin/client";
type Category = { id: string; name: string; _count: { places: number } };
export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [id, setId] = useState<string>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function refresh() {
    const data = await adminRequest("/api/admin/categories");
    setCategories(data.categories);
  }
  useEffect(() => {
    void refresh().catch((e) => setError(e.message));
  }, []);
  async function save(removeId?: string) {
    if (removeId && !confirm("Supprimer cette catégorie ?")) return;
    setBusy(true);
    setError("");
    try {
      await adminRequest(
        "/api/admin/categories",
        removeId ? "DELETE" : "POST",
        removeId ? { id: removeId } : { name, ...(id ? { id } : {}) },
      );
      setId(undefined);
      setName("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main>
      <h1 className="text-3xl font-extrabold">Catégories</h1>
      {error && (
        <p role="alert" className="mt-4 text-red-700">
          {error}
        </p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4"
      >
        <label className="flex-1 font-bold">
          Nom de la catégorie
          <input
            required
            minLength={2}
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 block w-full rounded-lg border p-2"
          />
        </label>
        <button
          disabled={busy}
          className="rounded-xl bg-primary-600 px-4 py-2 font-bold text-white"
        >
          {id ? "Enregistrer" : "Créer"}
        </button>
        {id && (
          <button
            type="button"
            onClick={() => {
              setId(undefined);
              setName("");
            }}
          >
            Annuler
          </button>
        )}
      </form>
      <div className="mt-6 space-y-3">
        {categories.map((category) => (
          <article
            key={category.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4"
          >
            <p>
              <strong>{category.name}</strong> · {category._count.places}{" "}
              établissements
            </p>
            <div className="flex gap-4">
              <button
                disabled={busy}
                onClick={() => {
                  setId(category.id);
                  setName(category.name);
                }}
              >
                Modifier
              </button>
              <button
                disabled={busy || category._count.places > 0}
                onClick={() => void save(category.id)}
                className="text-red-700 disabled:opacity-40"
              >
                Supprimer
              </button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
