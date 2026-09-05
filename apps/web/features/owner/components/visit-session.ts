"use client";

const visits = new Map<string, { at: number; promise: Promise<void> }>();
// Serialize the first requests so they share the same HttpOnly visitor cookie.
let chain = Promise.resolve();
export function waitForVisitTracking() {
  return chain;
}
export function ensurePlaceVisit(placeId: string) {
  const previous = visits.get(placeId);
  if (previous && Date.now() - previous.at < 30 * 60_000)
    return previous.promise;
  const channel = new URLSearchParams(window.location.search).get("qv_source");
  const promise = chain
    .then(async () => {
      const response = await fetch(`/api/places/${placeId}/visit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel }),
        cache: "no-store",
        keepalive: true,
        signal: AbortSignal.timeout(3000),
      });
      if (!response.ok) throw new Error("Tracking unavailable");
    })
    .catch(() => {
      visits.delete(placeId);
    });
  visits.set(placeId, { at: Date.now(), promise });
  chain = promise;
  return promise;
}
