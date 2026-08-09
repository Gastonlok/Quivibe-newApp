// apps/web/features/places/components/create-place-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createPlaceAction } from "@/features/places/actions";

interface CreatePlaceFormProps {
  onSuccess?: () => void;
   categories?: { id: string; name: string; slug: string }[];
}

export function CreatePlaceForm({ onSuccess }: CreatePlaceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    neighborhood: "",
    priceRange: "2",
    phone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setServerError(null);

    try {
      const result = await createPlaceAction({
        ...formData,
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
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Quartier
        </label>
        <select
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          value={formData.neighborhood}
          onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
        >
          <option value="">Sélectionner un quartier</option>
          {neighborhoods.map((hood) => (
            <option key={hood} value={hood}>{hood}</option>
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
          onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })}
        >
          <option value="1">€ (Bon marché)</option>
          <option value="2">€€ (Moyen)</option>
          <option value="3">€€€ (Cher)</option>
          <option value="4">€€€€ (Très cher)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Téléphone
        </label>
        <input
          type="tel"
          placeholder="+243 812 345 678"
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>

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
