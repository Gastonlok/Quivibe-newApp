"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { updateReservationStatusAction } from "../actions";

const ACTIONS_BY_STATUS: Record<
  string,
  Array<{ status: "CONFIRMED" | "COMPLETED" | "NO_SHOW" | "CANCELLED"; label: string }>
> = {
  PENDING: [
    { status: "CONFIRMED", label: "Confirmer" },
    { status: "CANCELLED", label: "Annuler" },
  ],
  CONFIRMED: [
    { status: "COMPLETED", label: "Terminée" },
    { status: "NO_SHOW", label: "Non honorée" },
    { status: "CANCELLED", label: "Annuler" },
  ],
};

export function OwnerReservationActions({
  reservationId,
  currentStatus,
}: {
  reservationId: string;
  currentStatus: string;
}) {
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const actions = ACTIONS_BY_STATUS[currentStatus] || [];

  if (actions.length === 0) return null;

  async function update(status: string) {
    setLoading(status);
    setError("");
    const result = await updateReservationStatusAction(reservationId, status);
    setLoading("");
    if (!result.success) setError(result.error);
  }

  return (
    <div>
      <div className="flex flex-wrap justify-end gap-2">
        {actions.map((action) => (
          <button
            key={action.status}
            type="button"
            onClick={() => update(action.status)}
            disabled={Boolean(loading)}
            className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:border-primary-600 hover:text-primary-700 disabled:opacity-50"
          >
            {loading === action.status && (
              <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
            )}
            {action.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-right text-xs font-semibold text-red-700">{error}</p>}
    </div>
  );
}
