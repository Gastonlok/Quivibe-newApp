"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createReviewSchema,
  type CreateReviewInput,
} from "@/features/reviews/schema";
import { createReviewAction } from "@/features/reviews/actions";

export function ReviewForm({ placeId }: { placeId: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateReviewInput>({
    resolver: zodResolver(createReviewSchema),
    defaultValues: { placeId, rating: 5 },
  });

  const onSubmit = async (values: CreateReviewInput) => {
    setServerError(null);

    const result = await createReviewAction(values);
    if (!result.success) {
      setServerError(result.error);
      return;
    }

    setSubmitted(true);
    router.refresh();
  };

  if (submitted) {
    return (
      <p className="text-sm text-green-700">
        Merci, ton avis a été publié !
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-3 border rounded-lg p-4"
    >
      <input type="hidden" value={placeId} {...register("placeId")} />

      <div className="flex flex-col gap-1">
        <label htmlFor="rating" className="text-sm font-medium">
          Note
        </label>
        <select
          id="rating"
          className="border rounded-md px-3 py-2 w-24"
          {...register("rating")}
        >
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value} / 5
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="comment" className="text-sm font-medium">
          Ton avis
        </label>
        <textarea
          id="comment"
          rows={3}
          placeholder="Raconte ton expérience..."
          className="border rounded-md px-3 py-2"
          {...register("comment")}
        />
        {errors.comment && (
          <p className="text-sm text-red-600">{errors.comment.message}</p>
        )}
      </div>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-black text-white rounded-md px-4 py-2 self-start disabled:opacity-50"
      >
        {isSubmitting ? "Publication..." : "Publier mon avis"}
      </button>
    </form>
  );
}
