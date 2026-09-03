"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Save,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { updateOwnerPlaceMenuAction } from "../actions";

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: string | null;
  category: string | null;
  available: boolean;
};

type MenuDraft = {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  available: boolean;
};

const inputClass =
  "mt-1.5 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-primary-600 focus:ring-4 focus:ring-primary-100";

function createEmptyMenuItem(): MenuDraft {
  return {
    id: `new-${crypto.randomUUID()}`,
    name: "",
    description: "",
    price: "",
    category: "",
    available: true,
  };
}

export function OwnerPlaceMenuEditor({
  placeId,
  initialMenuVisible,
  initialItems,
}: {
  placeId: string;
  initialMenuVisible: boolean;
  initialItems: MenuItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [menuVisible, setMenuVisible] = useState(initialMenuVisible);
  const [items, setItems] = useState<MenuDraft[]>(() =>
    initialItems.map((item) => ({
      ...item,
      description: item.description || "",
      price: item.price || "",
      category: item.category || "",
    })),
  );
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function updateItem(index: number, value: Partial<MenuDraft>) {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...value } : item)));
  }

  function moveItem(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    setItems((current) => {
      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function saveMenu(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    startTransition(() => {
      void updateOwnerPlaceMenuAction({
        placeId,
        menuVisible,
        items: items.map(({ name, description, price, category, available }) => ({
          name,
          description,
          price,
          category,
          available,
        })),
      }).then((result) => {
        setFeedback(
          result.success
            ? { type: "success", message: "Votre carte a ete enregistree." }
            : { type: "error", message: result.error || "Impossible d'enregistrer la carte." },
        );
        if (result.success) router.refresh();
      });
    });
  }

  return (
    <form onSubmit={saveMenu} className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-soft">
      <div className="bg-gradient-to-r from-orange-950 via-orange-800 to-amber-600 px-6 py-5 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-extrabold">Carte du restaurant</h2>
              <p className="mt-1 text-sm text-orange-50">Ajoutez vos plats, leurs prix et choisissez quand les rendre visibles.</p>
            </div>
          </div>
          <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-extrabold">
            {items.length} plat{items.length > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="p-6">
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-orange-50 p-4">
          <div className="flex items-start gap-3">
            {menuVisible ? <Eye className="mt-0.5 h-5 w-5 text-orange-800" /> : <EyeOff className="mt-0.5 h-5 w-5 text-orange-800" />}
            <div>
              <p className="font-extrabold text-gray-950">Afficher la carte sur votre fiche</p>
              <p className="mt-1 text-sm text-gray-600">
                {menuVisible ? "Les clients peuvent consulter les plats disponibles." : "Votre carte reste privee jusqu'a son activation."}
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={menuVisible}
            onChange={(event) => setMenuVisible(event.target.checked)}
            className="h-5 w-5 accent-orange-700"
          />
        </label>

        <div className="mt-6 space-y-4">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center">
              <UtensilsCrossed className="mx-auto h-7 w-7 text-gray-400" />
              <p className="mt-3 font-extrabold text-gray-800">Votre carte est encore vide</p>
              <p className="mt-1 text-sm text-gray-600">Ajoutez un premier plat pour commencer.</p>
            </div>
          ) : (
            items.map((item, index) => (
              <fieldset key={item.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <legend className="sr-only">Plat {index + 1}</legend>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-extrabold text-gray-900">Plat {index + 1}</p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveItem(index, -1)}
                      disabled={index === 0 || isPending}
                      aria-label="Remonter ce plat"
                      className="rounded-full p-2 text-gray-600 transition hover:bg-white hover:text-orange-800 disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(index, 1)}
                      disabled={index === items.length - 1 || isPending}
                      aria-label="Descendre ce plat"
                      className="rounded-full p-2 text-gray-600 transition hover:bg-white hover:text-orange-800 disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={isPending}
                      aria-label="Supprimer ce plat"
                      className="rounded-full p-2 text-gray-600 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <label className="block xl:col-span-2">
                    <span className="text-sm font-bold text-gray-800">Nom du plat</span>
                    <input
                      value={item.name}
                      onChange={(event) => updateItem(index, { name: event.target.value })}
                      className={inputClass}
                      placeholder="Poulet a la moambe"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-bold text-gray-800">Categorie</span>
                    <input
                      value={item.category}
                      onChange={(event) => updateItem(index, { category: event.target.value })}
                      className={inputClass}
                      placeholder="Plats principaux"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-bold text-gray-800">Prix</span>
                    <input
                      value={item.price}
                      onChange={(event) => updateItem(index, { price: event.target.value })}
                      className={inputClass}
                      placeholder="15 000 FC"
                    />
                  </label>
                  <label className="block md:col-span-2 xl:col-span-3">
                    <span className="text-sm font-bold text-gray-800">Description</span>
                    <input
                      value={item.description}
                      onChange={(event) => updateItem(index, { description: event.target.value })}
                      className={inputClass}
                      placeholder="Ingredients ou accompagnement (optionnel)"
                    />
                  </label>
                  <label className="mt-7 flex cursor-pointer items-center gap-3 text-sm font-bold text-gray-800">
                    <input
                      type="checkbox"
                      checked={item.available}
                      onChange={(event) => updateItem(index, { available: event.target.checked })}
                      className="h-4 w-4 accent-orange-700"
                    />
                    Disponible
                  </label>
                </div>
              </fieldset>
            ))
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setItems((current) => [...current, createEmptyMenuItem()])}
            disabled={isPending || items.length >= 100}
            className="inline-flex items-center gap-2 rounded-full border border-orange-700 bg-white px-4 py-2.5 text-sm font-extrabold text-orange-800 transition hover:bg-orange-50 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Ajouter un plat
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-full bg-orange-700 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer la carte
          </button>
        </div>

        {feedback && (
          <p
            role="status"
            className={`mt-5 rounded-2xl px-4 py-3 text-sm font-bold ${
              feedback.type === "success" ? "bg-primary-50 text-primary-800" : "bg-red-50 text-red-700"
            }`}
          >
            {feedback.message}
          </p>
        )}
      </div>
    </form>
  );
}
