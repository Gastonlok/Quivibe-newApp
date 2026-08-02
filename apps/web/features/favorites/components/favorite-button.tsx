"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addFavoriteAction, removeFavoriteAction } from "@/features/favorites/actions";

export function FavoriteButton({
  placeId,
  initialIsFavorite,
  isAuthenticated,
}: {
  placeId: string;
  initialIsFavorite: boolean;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    startTransition(async () => {
      if (isFavorite) {
        await removeFavoriteAction(placeId);
        setIsFavorite(false);
      } else {
        await addFavoriteAction(placeId);
        setIsFavorite(true);
      }
      router.refresh();
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={isFavorite}
      className="text-sm border rounded-md px-3 py-1.5 disabled:opacity-50"
    >
      {isFavorite ? "★ Dans mes favoris" : "☆ Ajouter aux favoris"}
    </button>
  );
}
