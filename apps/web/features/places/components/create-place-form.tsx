"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createPlaceSchema,
  type CreatePlaceInput,
} from "@/features/places/schema";
import { createPlaceAction } from "@/features/places/actions";

type Category = { id: string; name: string };

export function CreatePlaceForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreatePlaceInput>({
    resolver: zodResolver(createPlaceSchema),
    defaultValues: { priceRange: 2, categoryIds: [] },
  });

  const onSubmit = async (values: CreatePlaceInput) => {
    setServerError(null);

    const result = await createPlaceAction(values);
    if (!result.success) {
      setServerError(result.error);
      return;
    }

    router.push(`/etablissements/${result.data.slug}`);
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4 w-full max-w-lg"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          Nom de l&apos;établissement
        </label>
        <input id="name" className="border rounded-md px-3 py-2" {...register("name")} />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          className="border rounded-md px-3 py-2"
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="address" className="text-sm font-medium">
          Adresse
        </label>
        <input id="address" className="border rounded-md px-3 py-2" {...register("address")} />
        {errors.address && (
          <p className="text-sm text-red-600">{errors.address.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="neighborhood" className="text-sm font-medium">
          Quartier
        </label>
        <input
          id="neighborhood"
          className="border rounded-md px-3 py-2"
          {...register("neighborhood")}
        />
        {errors.neighborhood && (
          <p className="text-sm text-red-600">{errors.neighborhood.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="latitude" className="text-sm font-medium">
            Latitude
          </label>
          <input
            id="latitude"
            type="number"
            step="any"
            className="border rounded-md px-3 py-2"
            {...register("latitude")}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="longitude" className="text-sm font-medium">
            Longitude
          </label>
          <input
            id="longitude"
            type="number"
            step="any"
            className="border rounded-md px-3 py-2"
            {...register("longitude")}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="priceRange" className="text-sm font-medium">
          Budget (1 = économique, 4 = premium)
        </label>
        <select
          id="priceRange"
          className="border rounded-md px-3 py-2"
          {...register("priceRange")}
        >
          <option value={1}>$</option>
          <option value={2}>$$</option>
          <option value={3}>$$$</option>
          <option value={4}>$$$$</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className="text-sm font-medium">
          Téléphone (optionnel)
        </label>
        <input id="phone" className="border rounded-md px-3 py-2" {...register("phone")} />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium mb-1">Catégories</legend>
        {categories.map((category) => (
          <label key={category.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              value={category.id}
              {...register("categoryIds")}
            />
            {category.name}
          </label>
        ))}
        {errors.categoryIds && (
          <p className="text-sm text-red-600">{errors.categoryIds.message}</p>
        )}
      </fieldset>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-black text-white rounded-md px-4 py-2 disabled:opacity-50"
      >
        {isSubmitting ? "Création..." : "Créer ma fiche"}
      </button>
    </form>
  );
}
