// apps/web/features/places/components/create-place-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createPlaceAction } from "@/features/places/actions";
import { PhoneInput } from "@/components/phone-input";
import { ReservationSettings } from "@/features/reservations/components/reservation-settings";
import { LocationPicker } from "./location-picker";
import type { PlaceCoordinates } from "../location-schema";

interface CreatePlaceFormProps {
  onSuccess?: () => void;
  categories?: { id: string; name: string; slug: string }[];
}

export function CreatePlaceForm({
  onSuccess,
  categories = [],
}: CreatePlaceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [position, setPosition] = useState<PlaceCoordinates | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    neighborhood: "",
    priceRange: "2",
    phone: "",
    categoryId: "",
    reservationsEnabled: true,
    reservationPrice: "0",
    reservationCurrency: "USD" as "USD" | "CDF",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!position) {
      setServerError(
        "Sélectionnez l’emplacement de l’établissement sur la carte ou utilisez votre position.",
      );
      return;
    }
    setLoading(true);
    setServerError(null);

    try {
      const result = await createPlaceAction({
        ...formData,
        ...position,
        priceRange: parseInt(formData.priceRange),
      });

      if (!result.success) {
        // ✅ Correction ici
        setServerError(result.error || "Une erreur est survenue");
        return;
      }

      if (onSuccess) onSuccess();
      router.refresh();
    } catch (error) {
      setServerError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const neighborhoods = [
    "Gombe",
    "Kinshasa",
    "Lemba",
    "Limete",
    "Matete",
    "Mont Ngafula",
    "Ndjili",
    "Selembao",
    "Kalamu",
    "Bandalungwa",
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {serverError && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {serverError}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nom de l'établissement *
        </label>
        <input
          type="text"
          required
          placeholder="Le Jardin des Saveurs"
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          rows={3}
          placeholder="Décrivez l'établissement..."
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Adresse *
        </label>
        <input
          type="text"
          required
          placeholder="12 Avenue de la Gombe"
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          value={formData.address}
          onChange={(e) =>
            setFormData({ ...formData, address: e.target.value })
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Quartier
        </label>
        <select
          required
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          value={formData.neighborhood}
          onChange={(e) =>
            setFormData({ ...formData, neighborhood: e.target.value })
          }
        >
          <option value="">Sélectionner un quartier</option>
          {neighborhoods.map((hood) => (
            <option key={hood} value={hood}>
              {hood}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Catégorie
        </label>
        <select
          required
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          value={formData.categoryId}
          onChange={(e) =>
            setFormData({ ...formData, categoryId: e.target.value })
          }
        >
          <option value="">Sélectionner une catégorie</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Budget
        </label>
        <select
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          value={formData.priceRange}
          onChange={(e) =>
            setFormData({ ...formData, priceRange: e.target.value })
          }
        >
          <option value="1">$ (Bon marché)</option>
          <option value="2">$$ (Moyen)</option>
          <option value="3">$$$ (Haut de gamme)</option>
          <option value="4">$$$$ (Très haut de gamme)</option>
        </select>
      </div>

      <LocationPicker value={position} onChange={setPosition} />
      <ReservationSettings
        value={formData}
        onChange={(settings) => setFormData({ ...formData, ...settings })}
      />
      <PhoneInput
        value={formData.phone}
        onChange={(phone) => setFormData((current) => ({ ...current, phone }))}
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Création...
          </>
        ) : (
          "Créer l'établissement"
        )}
      </button>
    </form>
  );
}
