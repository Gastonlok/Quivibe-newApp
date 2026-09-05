ALTER TABLE "places"
  ADD COLUMN "reservationPriceMinor" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "reservationCurrency" TEXT NOT NULL DEFAULT 'USD',
  ADD CONSTRAINT "places_reservation_price_nonnegative" CHECK ("reservationPriceMinor" >= 0),
  ADD CONSTRAINT "places_reservation_currency_supported" CHECK ("reservationCurrency" IN ('USD', 'CDF'));

ALTER TABLE "reservations"
  ADD COLUMN "reservationPriceMinor" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "reservationCurrency" TEXT NOT NULL DEFAULT 'USD',
  ADD CONSTRAINT "reservations_price_nonnegative" CHECK ("reservationPriceMinor" >= 0),
  ADD CONSTRAINT "reservations_currency_supported" CHECK ("reservationCurrency" IN ('USD', 'CDF'));
