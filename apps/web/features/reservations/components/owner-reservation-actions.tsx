"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { updateReservationStatusAction } from "../actions";
import type { CompletionInput } from "../schema";

const ACTIONS_BY_STATUS: Record<
  string,
  Array<{
    status: "CONFIRMED" | "COMPLETED" | "NO_SHOW" | "CANCELLED";
    label: string;
  }>
> = {
  PENDING: [
    { status: "CONFIRMED", label: "Confirmer" },
    { status: "CANCELLED", label: "Annuler" },
  ],
  CONFIRMED: [
    { status: "COMPLETED", label: "Réalisée" },
    { status: "NO_SHOW", label: "Non honorée" },
    { status: "CANCELLED", label: "Annuler" },
  ],
};

export function OwnerReservationActions({
  reservationId,
  currentStatus,
  dateTime,
}: {
  reservationId: string;
  currentStatus: string;
  dateTime: string;
}) {
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const [completing, setCompleting] = useState(false);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"CDF" | "USD">("CDF");
  const actions = ACTIONS_BY_STATUS[currentStatus] || [];

  if (actions.length === 0) return null;

  async function update(status: string, completion: CompletionInput = {}) {
    if (loading) return;
    setLoading(status);
    setError("");
    try {
      const result = await updateReservationStatusAction(
        reservationId,
        status,
        completion,
      );
      if (!result.success) setError(result.error);
      else setCompleting(false);
    } catch {
      setError("Impossible d’enregistrer le résultat. Réessayez.");
    } finally {
      setLoading("");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap justify-end gap-2">
        {actions.map((action) => (
          <button
            key={action.status}
            type="button"
            onClick={() =>
              action.status === "COMPLETED"
                ? setCompleting(true)
                : update(action.status)
            }
            disabled={
              Boolean(loading) ||
              (["COMPLETED", "NO_SHOW"].includes(action.status) &&
                new Date(dateTime).getTime() > Date.now())
            }
            className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:border-primary-600 hover:text-primary-700 disabled:opacity-50"
          >
            {loading === action.status && (
              <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
            )}
            {action.label}
          </button>
        ))}
      </div>
      {completing && (
        <form
          className="mt-3 max-w-sm space-y-3 rounded-2xl bg-gray-50 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            void update(
              "COMPLETED",
              amount.trim() ? { totalAmount: amount.trim(), currency } : {},
            );
          }}
        >
          <p className="text-sm font-bold">
            Confirmer que les clients sont venus
          </p>
          <label className="block text-xs font-semibold">
            Montant consommé, facultatif
            <input
              aria-label="Montant consommé"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Laisser vide si inconnu"
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="block text-xs font-semibold">
            Devise
            <select
              value={currency}
              onChange={(event) =>
                setCurrency(event.target.value as "CDF" | "USD")
              }
              className="ml-2 rounded-lg border border-gray-300 px-2 py-1"
            >
              <option value="CDF">CDF</option>
              <option value="USD">USD</option>
            </select>
          </label>
          <p className="text-xs text-gray-500">
            Montant déclaré par le restaurant. Commission Quivibe : 0 pendant le
            pilote.
          </p>
          <div className="flex gap-3">
            <button
              disabled={Boolean(loading)}
              className="rounded-full bg-primary-600 px-4 py-2 text-xs font-bold text-white"
            >
              Enregistrer
            </button>
            <button
              type="button"
              onClick={() => setCompleting(false)}
              className="text-xs font-bold"
            >
              Fermer
            </button>
          </div>
        </form>
      )}
      {error && (
        <p className="mt-2 text-right text-xs font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
