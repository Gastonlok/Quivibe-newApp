"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PhoneInput } from "@/components/phone-input";
import { ReservationSettings } from "@/features/reservations/components/reservation-settings";
import { priceToInput } from "@/features/reservations/pricing";
import { LocationPicker } from "@/features/places/components/location-picker";
import {
  CalendarClock,
  ImagePlus,
  Link2,
  Loader2,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import {
  addOwnerPlaceImageAction,
  deleteOwnerPlaceImageAction,
  updateOwnerPlaceAction,
  uploadOwnerPlaceImageAction,
} from "../actions";
import {
  AMENITY_LABELS,
  AMENITY_VALUES,
  type Amenity,
} from "@/features/places/amenities";

type Category = { id: string; name: string; slug: string };

type OwnerPlace = {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  priceRange: number;
  phone: string | null;
  reservationsEnabled: boolean;
  reservationPriceMinor: number;
  reservationCurrency: string;
  reservationDuration: number;
  reservationCapacity: number;
  maxPartySize: number;
  autoConfirmReservations: boolean;
  reservationStartTime: string;
  reservationEndTime: string;
  reservationInterval: number;
  amenities: string[];
  categories: { category: Category }[];
  media: { id: string; url: string; altText: string | null }[];
};

const inputClass =
  "mt-1.5 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-primary-600 focus:ring-4 focus:ring-primary-100";

export function OwnerPlaceEditor({
  place,
  categories,
}: {
  place: OwnerPlace;
  categories: Category[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [form, setForm] = useState({
    name: place.name,
    description: place.description,
    address: place.address,
    neighborhood: place.neighborhood,
    latitude: place.latitude,
    longitude: place.longitude,
    priceRange: place.priceRange,
    phone: place.phone || "",
    categoryIds: place.categories.map(({ category }) => category.id),
    amenities: place.amenities.filter((amenity): amenity is Amenity =>
      AMENITY_VALUES.includes(amenity as Amenity),
    ),
    reservationsEnabled: place.reservationsEnabled,
    reservationPrice: priceToInput(place.reservationPriceMinor),
    reservationCurrency: place.reservationCurrency as "USD" | "CDF",
    reservationDuration: place.reservationDuration,
    reservationCapacity: place.reservationCapacity,
    maxPartySize: place.maxPartySize,
    autoConfirmReservations: place.autoConfirmReservations,
    reservationStartTime: place.reservationStartTime,
    reservationEndTime: place.reservationEndTime,
    reservationInterval: place.reservationInterval,
  });

  function setResult(
    result: { success: boolean; error?: string },
    successMessage: string,
  ) {
    setFeedback(
      result.success
        ? { type: "success", message: successMessage }
        : {
            type: "error",
            message: result.error || "Une erreur est survenue.",
          },
    );
    if (result.success) router.refresh();
  }

  function toggleCategory(categoryId: string) {
    setForm((current) => ({
      ...current,
      categoryIds: current.categoryIds.includes(categoryId)
        ? current.categoryIds.filter((id) => id !== categoryId)
        : [...current.categoryIds, categoryId],
    }));
  }

  function toggleAmenity(amenity: Amenity) {
    setForm((current) => ({
      ...current,
      amenities: current.amenities.includes(amenity)
        ? current.amenities.filter((value) => value !== amenity)
        : [...current.amenities, amenity],
    }));
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const result = await updateOwnerPlaceAction({
          placeId: place.id,
          ...form,
        });
        setResult(result, "Vos modifications ont été enregistrées.");
      } catch {
        setResult(
          {
            success: false,
            error: "Impossible d’enregistrer les modifications. Réessayez.",
          },
          "",
        );
      }
    });
  }

  function handleImageUrl(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(() => {
      void addOwnerPlaceImageAction({
        placeId: place.id,
        url: imageUrl,
        altText: imageAlt,
      }).then((result) => {
        setResult(result, "L'image a ete ajoutee a votre galerie.");
        if (result.success) {
          setImageUrl("");
          setImageAlt("");
        }
      });
    });
  }

  function handleImageUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const uploadForm = event.currentTarget;
    const formData = new FormData(uploadForm);
    startTransition(() => {
      void uploadOwnerPlaceImageAction(place.id, formData).then((result) => {
        setResult(result, "L'image a ete envoyee dans votre galerie.");
        if (result.success) uploadForm.reset();
      });
    });
  }

  function deleteImage(mediaId: string) {
    startTransition(() => {
      void deleteOwnerPlaceImageAction(place.id, mediaId).then((result) =>
        setResult(result, "L'image a ete retiree."),
      );
    });
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <p
          role="status"
          className={`rounded-2xl px-4 py-3 text-sm font-bold ${
            feedback.type === "success"
              ? "bg-primary-50 text-primary-800"
              : "bg-red-50 text-red-700"
          }`}
        >
          {feedback.message}
        </p>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
              Votre fiche
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-950">
              Informations de l'etablissement
            </h2>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="text-sm font-bold text-gray-800">Nom</span>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                className={inputClass}
                required
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-bold text-gray-800">
                Description
              </span>
              <textarea
                rows={5}
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                className={`${inputClass} resize-y`}
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-gray-800">Adresse</span>
              <input
                value={form.address}
                onChange={(event) =>
                  setForm({ ...form, address: event.target.value })
                }
                className={inputClass}
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-gray-800">Quartier</span>
              <input
                value={form.neighborhood}
                onChange={(event) =>
                  setForm({ ...form, neighborhood: event.target.value })
                }
                className={inputClass}
                required
              />
            </label>
            <PhoneInput
              value={form.phone}
              onChange={(phone) =>
                setForm((current) => ({ ...current, phone }))
              }
            />
            <label className="block">
              <span className="text-sm font-bold text-gray-800">
                Gamme de prix
              </span>
              <select
                value={form.priceRange}
                onChange={(event) =>
                  setForm({ ...form, priceRange: Number(event.target.value) })
                }
                className={inputClass}
              >
                {[1, 2, 3, 4].map((value) => (
                  <option key={value} value={value}>
                    {"$".repeat(value)}
                  </option>
                ))}
              </select>
            </label>
            <div className="md:col-span-2">
              <LocationPicker
                value={{ latitude: form.latitude, longitude: form.longitude }}
                onChange={(position) =>
                  setForm((current) => ({ ...current, ...position }))
                }
              />
            </div>
          </div>

          <fieldset className="mt-6">
            <legend className="text-sm font-bold text-gray-800">
              Categories
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.map((category) => {
                const selected = form.categoryIds.includes(category.id);
                return (
                  <label
                    key={category.id}
                    className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-extrabold transition ${
                      selected
                        ? "border-primary-600 bg-primary-600 text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:border-primary-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleCategory(category.id)}
                      className="sr-only"
                    />
                    {category.name}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="mt-6 border-t border-gray-100 pt-6">
            <legend className="text-sm font-bold text-gray-800">
              Équipements et ambiance
            </legend>
            <p className="mt-1 text-sm text-gray-600">
              Ces informations permettent à Quivibe AI de recommander votre
              établissement selon les envies des clients.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {AMENITY_VALUES.map((amenity) => {
                const selected = form.amenities.includes(amenity);
                return (
                  <label
                    key={amenity}
                    className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-extrabold transition ${selected ? "border-primary-600 bg-primary-600 text-white" : "border-gray-300 bg-white text-gray-700 hover:border-primary-600"}`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleAmenity(amenity)}
                      className="sr-only"
                    />
                    {AMENITY_LABELS[amenity]}
                  </label>
                );
              })}
            </div>
          </fieldset>
        </section>

        <details
          open
          className="overflow-hidden rounded-3xl border border-primary-100 bg-white shadow-soft"
        >
          <summary className="cursor-pointer list-none bg-gradient-to-r from-primary-800 to-primary-600 px-6 py-5 text-white [&::-webkit-details-marker]:hidden">
            <div className="flex items-center gap-3">
              <CalendarClock className="h-6 w-6" />
              <div>
                <h2 className="text-xl font-extrabold">
                  Réservations sur Quivibe
                </h2>
                <p className="mt-1 text-sm text-primary-50">
                  {form.reservationsEnabled
                    ? "Service activé"
                    : "Service désactivé"}{" "}
                  — activation, tarif, horaires et capacité.
                </p>
              </div>
            </div>
          </summary>
          <div className="p-6">
            <ReservationSettings
              value={form}
              onChange={(settings) => setForm({ ...form, ...settings })}
            />

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block">
                <span className="text-sm font-bold text-gray-800">
                  Debut des reservations
                </span>
                <input
                  type="time"
                  value={form.reservationStartTime}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      reservationStartTime: event.target.value,
                    })
                  }
                  className={inputClass}
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-gray-800">
                  Fin des reservations
                </span>
                <input
                  type="time"
                  value={form.reservationEndTime}
                  onChange={(event) =>
                    setForm({ ...form, reservationEndTime: event.target.value })
                  }
                  className={inputClass}
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-gray-800">
                  Intervalle entre les creneaux
                </span>
                <select
                  value={form.reservationInterval}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      reservationInterval: Number(event.target.value),
                    })
                  }
                  className={inputClass}
                >
                  {[15, 30, 45, 60].map((value) => (
                    <option key={value} value={value}>
                      {value} minutes
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-gray-800">
                  Duree d'une reservation
                </span>
                <select
                  value={form.reservationDuration}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      reservationDuration: Number(event.target.value),
                    })
                  }
                  className={inputClass}
                >
                  {[30, 60, 90, 120, 150, 180].map((value) => (
                    <option key={value} value={value}>
                      {value} minutes
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-gray-800">
                  Capacite par creneau
                </span>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={form.reservationCapacity}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      reservationCapacity: Number(event.target.value),
                    })
                  }
                  className={inputClass}
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-gray-800">
                  Maximum par reservation
                </span>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={form.maxPartySize}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      maxPartySize: Number(event.target.value),
                    })
                  }
                  className={inputClass}
                  required
                />
              </label>
            </div>

            <label className="mt-5 flex cursor-pointer items-center gap-3 text-sm font-bold text-gray-800">
              <input
                type="checkbox"
                checked={form.autoConfirmReservations}
                onChange={(event) =>
                  setForm({
                    ...form,
                    autoConfirmReservations: event.target.checked,
                  })
                }
                className="h-4 w-4 accent-primary-700"
              />
              Confirmer automatiquement les reservations qui respectent la
              capacite
            </label>
          </div>
        </details>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-soft transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Enregistrer les modifications
        </button>
      </form>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
              Galerie
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-950">
              Vos images
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              La premiere image est utilisee comme visuel principal de votre
              fiche.
            </p>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-extrabold text-gray-700">
            {place.media.length} image{place.media.length > 1 ? "s" : ""}
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {place.media.map((media, index) => (
            <article
              key={media.id}
              className="group overflow-hidden rounded-2xl border border-gray-200 bg-gray-50"
            >
              <div className="relative aspect-[4/3] bg-gray-100">
                <img
                  src={media.url}
                  alt={media.altText || place.name}
                  className="h-full w-full object-cover"
                />
                {index === 0 && (
                  <span className="absolute left-3 top-3 rounded-full bg-gray-950/80 px-3 py-1 text-xs font-extrabold text-white">
                    Image principale
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 p-3">
                <p className="truncate text-sm font-bold text-gray-700">
                  {media.altText || "Image de l'etablissement"}
                </p>
                <button
                  type="button"
                  onClick={() => deleteImage(media.id)}
                  disabled={isPending}
                  aria-label="Supprimer cette image"
                  className="rounded-full p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <form
            onSubmit={handleImageUpload}
            className="rounded-2xl border border-dashed border-primary-300 bg-primary-50/60 p-5"
          >
            <div className="flex items-center gap-3 text-primary-800">
              <Upload className="h-5 w-5" />
              <h3 className="font-extrabold">Envoyer un fichier</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              JPG, PNG ou WebP, 10 Mo maximum. Requiert la configuration
              Cloudinary.
            </p>
            <input
              name="image"
              type="file"
              accept="image/*"
              className="mt-4 block w-full text-sm text-gray-700"
              required
            />
            <input
              name="altText"
              placeholder="Description de l'image (optionnel)"
              className={inputClass}
            />
            <button
              type="submit"
              disabled={isPending}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-primary-700 disabled:opacity-60"
            >
              <ImagePlus className="h-4 w-4" /> Envoyer l'image
            </button>
          </form>

          <form
            onSubmit={handleImageUrl}
            className="rounded-2xl border border-gray-200 bg-gray-50 p-5"
          >
            <div className="flex items-center gap-3 text-gray-900">
              <Link2 className="h-5 w-5 text-primary-700" />
              <h3 className="font-extrabold">Ajouter par lien</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Utilisez une URL directe vers une image deja hebergee.
            </p>
            <input
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              type="url"
              placeholder="https://..."
              className={inputClass}
              required
            />
            <input
              value={imageAlt}
              onChange={(event) => setImageAlt(event.target.value)}
              placeholder="Description de l'image (optionnel)"
              className={inputClass}
            />
            <button
              type="submit"
              disabled={isPending}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary-600 bg-white px-4 py-2.5 text-sm font-extrabold text-primary-700 hover:bg-primary-50 disabled:opacity-60"
            >
              <Link2 className="h-4 w-4" /> Ajouter le lien
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
