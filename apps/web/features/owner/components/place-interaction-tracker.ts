"use client";

export function trackPlaceInteraction(placeId: string, type: "DIRECTIONS" | "FAVORITE" | "RESERVATION_START") {
  void fetch(`/api/places/${placeId}/interaction`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type }), keepalive: true });
}
