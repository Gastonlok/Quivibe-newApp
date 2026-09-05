"use client";

import { useEffect } from "react";
import { ensurePlaceVisit } from "./visit-session";

export function PlaceVisitTracker({ placeId }: { placeId: string }) {
  useEffect(() => {
    void ensurePlaceVisit(placeId);
  }, [placeId]);

  return null;
}
