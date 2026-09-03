"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cancelMyReservationAction } from "../actions";

export function CancelReservationButton({
  reservationId,
}: {
  reservationId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function cancel() {
    if (!window.confirm("Annuler cette réservation ?")) return;
    setLoading(true);
    setError("");
    const result = await cancelMyReservationAction(reservationId);
    setLoading(false);
    if (!result.success) setError(result.error);
  }

  return (
    <div>
      <button
        type="button"
        onClick={cancel}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Annuler
      </button>
      {error && <p className="mt-2 text-xs font-semibold text-red-700">{error}</p>}
    </div>
  );
}
