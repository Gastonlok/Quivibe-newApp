"use client";

export function ReservationSettings({
  value,
  onChange,
}: {
  value: {
    reservationsEnabled: boolean;
    reservationPrice: string;
    reservationCurrency: "USD" | "CDF";
  };
  onChange: (value: {
    reservationsEnabled: boolean;
    reservationPrice: string;
    reservationCurrency: "USD" | "CDF";
  }) => void;
}) {
  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-primary-50 p-4">
        <span>
          <span className="block font-extrabold text-gray-950">
            Accepter les réservations sur Quivibe
          </span>
          <span className="mt-1 block text-sm text-gray-600">
            Vous pouvez activer ou désactiver ce service à tout moment. Les
            réservations déjà reçues sont conservées.
          </span>
        </span>
        <input
          type="checkbox"
          checked={value.reservationsEnabled}
          onChange={(event) =>
            onChange({ ...value, reservationsEnabled: event.target.checked })
          }
          className="h-5 w-5 shrink-0 accent-primary-700"
        />
      </label>
      {value.reservationsEnabled && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold text-gray-800">
              Montant par réservation
              <input
                type="text"
                inputMode="decimal"
                required
                maxLength={11}
                pattern="[0-9]+([.,][0-9]{1,2})?"
                value={value.reservationPrice}
                onChange={(event) =>
                  onChange({ ...value, reservationPrice: event.target.value })
                }
                className="mt-1.5 w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-100"
              />
            </label>
            <label className="block text-sm font-bold text-gray-800">
              Devise de réservation
              <select
                value={value.reservationCurrency}
                onChange={(event) =>
                  onChange({
                    ...value,
                    reservationCurrency: event.target.value as "USD" | "CDF",
                  })
                }
                className="mt-1.5 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-100"
              >
                <option value="USD">USD — Dollar américain</option>
                <option value="CDF">CDF — Franc congolais</option>
              </select>
            </label>
          </div>
          <p className="text-sm leading-6 text-gray-600">
            Indiquez 0 pour une réservation gratuite. Ce montant concerne toute
            la réservation, quel que soit le nombre de personnes, et ne comprend
            pas les consommations. Un changement de tarif s’applique uniquement
            aux nouvelles réservations. Le règlement se fait directement auprès
            de votre établissement.
          </p>
          <p className="rounded-2xl border border-primary-100 bg-primary-50/50 p-4 text-sm leading-6 text-gray-700">
            Pendant l’essai gratuit, Quivibe ne prélève aucune commission. Après
            l’essai et l’intégration des paiements en ligne, Quivibe définira le
            pourcentage de commission applicable et vous en informera.
          </p>
        </>
      )}
    </div>
  );
}
