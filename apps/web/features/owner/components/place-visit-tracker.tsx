"use client";

import { useEffect } from "react";

export function PlaceVisitTracker({ placeId }: { placeId: string }) {
  useEffect(() => {
    void fetch(`/api/places/${placeId}/visit`, {
      method: "POST",
      cache: "no-store",
      keepalive: true,
    });
  }, [placeId]);

  return null;
}
